from shutil import which
import subprocess
import xml
import xml.etree.ElementTree
import psutil

class Stats(object):
	def get(self):
		return {
			'cpu': self.get_cpu_stats(),
			'gpu': self.get_gpu_stats(),
			'ram': self.get_ram_stats(),
			'storage': self.get_storage_stats(),
			'battery': self.get_battery_stats(),
			'temps': self.get_temperatures()
		}

	def get_gpu_stats(self):
		if which('nvidia-smi') is None:
			return {'available': False}
		
		command  = ['nvidia-smi', '-q', '-x']
		response = subprocess.check_output(command)
		gpu      = xml.etree.ElementTree.fromstring(response).find("gpu")

		gpu_temp     = gpu.find("temperature")
		gpu_temp_now = int(gpu_temp.find("gpu_temp").text.rpartition('C')[0])
		gpu_temp_max = int(gpu_temp.find("gpu_temp_max_threshold").text.rpartition('C')[0])

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

	def get_storage_stats(self):
		disks = []
		for x in range(1):
			partition_info  = psutil.disk_usage('/')
			partition_usage = partition_info.percent
			partition_used  = round( partition_info.used / 1000000000, 2 )
			partition_total = round( partition_info.total / 1000000000, 2 )

			disks.append({
				'disk_used': partition_used,
				'disk_total': partition_total,
				'disk_usage': partition_usage,
			}) 
		
		return {
			'available': True,
			'disks': disks
		}

	def get_battery_stats(self):
		try:
			battery = psutil.sensors_battery()
			return {
				'available': True,
				'charge': battery.percent,
				'ac_plug': battery.power_plugged
			}
		except AttributeError:
			return {'available': False}

	def get_temperatures(self):
		try:
			temps = psutil.sensors_temperatures()
		except AttributeError:
			return {'available': False}
		
		collection = {'available': True, 'measurements': []}
		for name, measurements in temps.items():
			if name == 'k10temp':
				collection['measurements'].append({
					'name': 'AMD Processor',
					'current': measurements[0].current,
					'limit': measurements[0].critical
				})

		return collection
