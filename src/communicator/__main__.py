from http.server import BaseHTTPRequestHandler, HTTPServer
from shutil import Error
from urllib.parse import urlparse, parse_qs
from communicator.stats import Stats
from communicator.actions import Actions
from communicator.network import Network
import json
import time
import sys, os

hostname = "0.0.0.0"
port     = 43594

class Server(BaseHTTPRequestHandler):
	def do_GET(self):
		input_key = parse_qs( urlparse(self.path).query).get('key', None)
		input_cmd = parse_qs( urlparse(self.path).query).get('cmd', None)
		input_cmd = parse_qs( urlparse(self.path).query).get('networkscan', None)

		currentdir = os.path.split(os.path.abspath(__file__))[0]
		use_key  = False
		key      = ''
		a_shdwn  = False
		use_scan = False
		try:
			with open(currentdir + "/config.json") as json_file:
				data = json.load(json_file)

				use_key  = data['auth'] if 'auth' in data else False
				key      = data['key'] if 'key' in data else ''
				a_shdwn  = data['permitShutdown'] if 'permitShutdown' in data else False
				use_scan = data['permitNetscan'] if 'permitNetscan' in data else False

		except FileNotFoundError:
			pass

		if use_key == False or ( use_key == True and ( input_key != None and input_key[0] == key ) ):
			if use_scan == True and input_cmd != None:
				all_devices = Network().get_all()
				self.fire_response(200, {
					'success': True,
					'content': all_devices
				})
			elif ( a_shdwn == True and input_cmd != None and input_cmd[0] != None ):
				try:
					Actions(input_cmd[0])

					self.fire_response(200, {
						'success': True,
					})
				except Error:
					self.fire_response(400, {
						'success': False,
						'message': 'Incorrect command recieved.'
					})
			else:
				self.fire_response(200, {
					'success': True,
					'content': Stats().get()
				})
		else:
			self.fire_response(401, {
				'success': False,
				'message': 'Either no key was provided, or it was incorrect.'
			})
	
	def set_headers(self, response_code, headers):
		self.send_response(response_code)
		for key, value in headers.items():
			self.send_header(key, value)
		self.end_headers()
	
	def fire_response(self, code, respo):
		self.set_headers(code, {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'})
		self.wfile.write(bytes(json.dumps(respo), "utf-8"))

if __name__ == "__main__":        
	http_server = HTTPServer((hostname, port), Server)
	print("Server started http://%s:%s" % (hostname, port))

	try:
		http_server.serve_forever()
	except KeyboardInterrupt:
		pass

	http_server.server_close()
	print("Server stopped.")