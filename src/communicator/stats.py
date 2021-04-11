from shutil import which
import subprocess
import xml
import xml.etree.ElementTree

class Stats(object):
	def get(self):
		return {
			'gpu': self.get_gpu_stats()
		}

	def get_gpu_stats(self):
		if which('nvidia-smi') is None:
			return {'available': False}
		
		command  = ['nvidia-smi', '-q', '-x']
		response = subprocess.check_output(command)
		gpu      = xml.etree.ElementTree.fromstring(response).find("gpu")

		gpu_temp     = gpu.find("temperature")
		gpu_temp_now = gpu_temp.find("gpu_temp").text 
		gpu_temp_max = gpu_temp.find("gpu_temp_max_threshold").text

		return {
			'available': True,
			'gpu_temp_now': gpu_temp_now, 
			'gpu_temp_max': gpu_temp_max
		}
		