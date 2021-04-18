import nmap
import socket

class Network(object):
	def get_all(self):
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
		try:
			return socket.gethostbyaddr(ip)[0]
		except:
			return ip