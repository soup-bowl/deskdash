import subprocess
import xml
import xml.etree.ElementTree

class Stats(object):
	def get(self):
		bob = self.get_gpu_stats()
		return 1

	def get_gpu_stats(self):
		command  = ['nvidia-smi', '-q', '-x']
		response = subprocess.check_output(command)
		gpu      = xml.etree.ElementTree.fromstring(response).find("gpu")

		gpu_temp     = gpu.find("temperature")
		gpu_temp_now = gpu_temp.find("gpu_temp").text 
		gpu_temp_max = gpu_temp.find("gpu_temp_max_threshold").text

		return {'gpu_temp_now': gpu_temp_now, 'gpu_temp_max': gpu_temp_max}
		