from shutil import which
import subprocess
import xml
import xml.etree.ElementTree
import psutil

class Stats(object):
	def get(self):
		return {
			'gpu': self.get_gpu_stats(),
			'cpu': self.get_cpu_stats(),
			'ram': self.get_ram_stats()
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
	
	def get_cpu_stats(self):
		cpu_usage = psutil.cpu_percent(0, False)

		return {
			'available': True,
			'cpu_usage': cpu_usage
		}
	
	def get_ram_stats(self):
		ram_usage  = psutil.virtual_memory().percent
		page_usage = psutil.swap_memory().percent

		return {
			'available': True,
			'real_memory_usage': ram_usage,
			'swap_memory_usage': page_usage
		}
		
		