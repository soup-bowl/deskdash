import nmap
import socket
import json
import os
import time

class Network(object):
	"""Sends an nmap request around the network and collates information about everything that responds.
	"""
	def get_all(self):
		"""Gets network devices. Cached per minute to speed up response times.

		Returns:
			dict: 4th octave IP address value as key, and their associated collected data.
		"""
		conf  = 'netmem.json'

		if os.path.isfile(conf):
			if time.time() > (os.path.getmtime(conf) + 300 ):
				os.remove(conf)
			else:
				with open(conf) as f:
					hosts = json.load(f)
					return hosts

		hosts = self.net_scan_all()
		with open(conf, 'w') as f:
			json.dump(hosts, f)

		return hosts

	def net_scan_all(self):
		"""Scans the network and collects information.

		Returns:
			dict: 4th octave IP address value as key, and their associated collected data.
		"""
		hosts = {}
		nm = nmap.PortScanner()
		nm.scan(hosts='192.168.1.0/24', arguments='-n -sP -PE -PA21,23,80,3389')
		hlist = [(x, nm[x]['status']['state']) for x in nm.all_hosts()]
		for host, status in hlist:
			a = {}
			a['ip']       = host
			a['hostname'] = self.get_hostname(host)
			a['status']   = status
			hosts[host.split(".")[3]] = a
		
		return hosts
	
	def get_hostname(self, ip):
		"""Attempts a local DNS lookup of the specified IP address.

		Args:
			ip (string): IP address of desired device.

		Returns:
			string: Either the hostname, or the IP address is re-returned.
		"""
		try:
			return socket.gethostbyaddr(ip)[0]
		except:
			return ip