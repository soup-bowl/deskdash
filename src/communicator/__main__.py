from http.server import BaseHTTPRequestHandler, HTTPServer
from communicator.stats import Stats
import json
import time

hostname = "localhost"
port     = 43594

class Server(BaseHTTPRequestHandler):
	def do_GET(self):
		self.set_headers(200, {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'})
		response = {
			'success': True,
			'content': Stats().get()
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