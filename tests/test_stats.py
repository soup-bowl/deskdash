from communicator.stats import Stats

from shutil import which
import unittest

class StatChecks(unittest.TestCase):
	@classmethod
	def setUpClass(self):
		self.stats = Stats()

	def test_get_gpu_stats(self):
		temps = self.stats.get()['gpu']

		self.assertIn('available', temps)

	def test_get_cpu_ram_stats(self):
		cpu = self.stats.get()['cpu']
		ram = self.stats.get()['ram']

		
		self.assertTrue(cpu['available'])
		self.assertGreaterEqual(cpu['cpu_usage'], 0)
		self.assertLessEqual(cpu['cpu_usage'], 100)

		self.assertTrue(ram['available'])
		self.assertGreaterEqual(ram['real_memory_usage'], 0)
		self.assertLessEqual(ram['real_memory_usage'], 100)
