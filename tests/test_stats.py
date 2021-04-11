from communicator.stats import Stats

from shutil import which
import unittest

class StatChecks(unittest.TestCase):
	def test_get_gpu_temperature(self):
		temps = Stats().get_gpu_stats()

		self.assertIn('available', temps)
