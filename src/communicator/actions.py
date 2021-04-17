from shutil import Error
import subprocess
import platform


class Actions(object):
	def __init__(self, action):
		if (action == 'shutdown'):
			self.shutdown()
		else:
			raise Error
	def shutdown(self):
		if ( platform.system() == "Windows" ):
			subprocess.call(["shutdown", "/s", "/t", "10"])
		else:
			subprocess.call(["shutdown", "-h", "-t", "10"])
