from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from communicator.stats import Stats
import json
import time
import sys, os

hostname = "0.0.0.0"
port     = 43594

class Server(BaseHTTPRequestHandler):
	def do_GET(self):
		input_key = parse_qs( urlparse(self.path).query).get('key', None)

		currentdir = os.path.split(os.path.abspath(__file__))[0]
		use_key = False
		key     = ''
		try:
			with open(currentdir + "/config.json") as json_file:
				data = json.load(json_file)
				use_key = data['auth']
				key     = data['key']

		except FileNotFoundError:
			pass

		if use_key == False or ( use_key == True and ( input_key != None and input_key[0] == key ) ):
			self.set_headers(200, {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'})
			response = {
				'success': True,
				'content': Stats().get()
			}
			self.wfile.write(bytes(json.dumps(response), "utf-8"))
		else:
			self.set_headers(401, {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'})
			response = {
				'success': False,
				'message': 'Either no key was provided, or it was incorrect.'
			}
			self.wfile.write(bytes(json.dumps(response), "utf-8"))
	
	def set_headers(self, response_code, headers):
		self.send_response(response_code)
		for key, value in headers.items():
			self.send_header(key, value)
		self.end_headers()

if __name__ == "__main__":        
	http_server = HTTPServer((hostname, port), Server)
	print("Server started http://%s:%s" % (hostname, port))

	try:
		http_server.serve_forever()
	except KeyboardInterrupt:
		pass

	http_server.server_close()
	print("Server stopped.")