from shutil import Error
import subprocess
import platform


class Actions(object):
	"""Runs system interactions.
	"""
	def __init__(self, action):
		if (action == 'shutdown'):
			self.shutdown()
		else:
			raise Error
	def shutdown(self):
		"""Shuts down the API host.
		"""
		if ( platform.system() == "Windows" ):
			subprocess.call(["shutdown", "/s", "/t", "10"])
		else:
			subprocess.call(["shutdown", "-h", "-t", "10"])
