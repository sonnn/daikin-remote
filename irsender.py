#!/usr/bin/env python
import pigpio
import time
import argparse

OUTPUT_PIN = 17;
DUTY_CYCLE = 0.5;
FREQUENCY = 38000;

START_PLUSE_DURATION = 3500;
START_GAP_DURATION = 1600;

PLUSE_ONE = 480;
GAP_ONE = 1200;

PLUSE_ZERO = 480;
GAP_ZERO = 350;

class TX:
  def __init__(self, pi, out_put_pin, duty_cycle, frequency):
    self.pi = pi
    self.out_put_pin = out_put_pin
    self.duty_cycle = duty_cycle # between 0 and 1
    self.frequency = frequency
    
    self.one_cycle_duration = 1000000 / frequency
    self.on_duration = round(self.one_cycle_duration * self.duty_cycle)
    self.off_duration = self.one_cycle_duration - self.on_duration
    
    self.wave_form = []
    self.wave_id = -1
    self.offset = 0

    self.pi.set_mode(self.out_put_pin, pigpio.OUTPUT)
    self.pi.wave_clear()

    
  def add_pulse(self, on_gpio, off_gpio, duration):
    self.wave_form.append(pigpio.pulse(on_gpio, off_gpio, duration))

  def add_carrier_frequency(self, duration):
    total_on_cycle = round((duration + self.on_duration) / self.one_cycle_duration)

    if total_on_cycle * 2 + 1 + len(self.wave_form) > 680:
        pulses = self.pi.wave_add_generic(self.wave_form)
        print("waveform partial {} pulses".format(pulses))
        self.offset = self.pi.wave_get_micros()
        self.wave_form = [pigpio.pulse(0, 0, self.offset)]

    for index in range(int(total_on_cycle)):
      self.add_pulse(1 << self.out_put_pin, 0, self.on_duration) # on pulse
      self.add_pulse(0, 1 << self.out_put_pin, self.off_duration) # off pulse

  def add_gap(self, duration):
    self.add_pulse(0, 0, duration)

  def clear(self):
    self.wave_form = []

    if self.wave_id > -1:
      self.pi.wave_delete(self.wave_id)
      self.wave_id = -1
  
  def construct_code(self):
    if len(self.wave_form) > 0:
      pulses = self.pi.wave_add_generic(self.wave_form)
      print("waveform TOTAL {} pulses".format(pulses))
      self.wave_id = self.pi.wave_create()
    
  def send_code(self):
    if self.wave_id >= 0:
         self.pi.wave_send_once(self.wave_id)
         while self.pi.wave_tx_busy():
            pass

  def add_pulses(self, binary_code, one_on, one_gap, zero_on, zero_gap):
    # binary_code = "0101..."
    for bit in binary_code:
      if int(bit) == 1:
        self.add_carrier_frequency(one_on);
        self.add_gap(one_gap);
      else:
        self.add_carrier_frequency(zero_on);
        self.add_gap(zero_gap);
  
  def is_busy(self):
    time.sleep(0.1)
    return self.pi.wave_tx_busy()

  def delete_wave(self):
    if self.wave_id > 0:
      self.pi.wave_delete(self.wave_id)
  

if __name__ == "__main__":
  argument_parser = argparse.ArgumentParser()
  
  argument_parser.add_argument("-cs", "--checksum",
    help="checksum for package",
    type=str,
    default="1000100001011011111001000000111100000000000000000000000001000000",
  )

  argument_parser.add_argument("-cm", "--command",
    help="Command",
    type=str,
    default="10001000010110111110010000000000000000000000110001101100000000000000010100000000000000000000000000000000000000000000000000000011000000000000000000011011",
  )

  args = argument_parser.parse_args()

  # gpio_in_pin=17,gpio_out_pin=10
  OUT_PUT_PIN = 10
  DUTY_CYCLE = 0.33
  FREQUENCY = 38000
  
  # start the package
  START_PACKAGE_DURATION = 3500
  GAP_PACKAGE_DURATION = 1600

  # start frame
  START_FRAME_DURATION = 480
  GAP_FRAME_DURATION = 30000

  # normal signal
  ONE_ON_DURATION = 440
  ONE_OFF_DURATION = 1300

  ZERO_ON_DURATION = 480
  ZERO_OFF_DURATION = 440

  # binary test 
  FIRST_PART = args.checksum
  SECOND_PART = args.command

  # pigpio
  pi = pigpio.pi()
  tx = TX(pi, OUT_PUT_PIN, DUTY_CYCLE, FREQUENCY)

  # clear
  tx.clear()

  # add package start
  tx.add_carrier_frequency(START_PACKAGE_DURATION)
  tx.add_gap(GAP_PACKAGE_DURATION)

  tx.add_pulses(FIRST_PART, ONE_ON_DURATION, ONE_OFF_DURATION, ZERO_ON_DURATION, ZERO_OFF_DURATION)
  
  # add package end and frame start
  tx.add_carrier_frequency(START_FRAME_DURATION)
  tx.add_gap(GAP_FRAME_DURATION)

  tx.add_carrier_frequency(START_PACKAGE_DURATION)
  tx.add_gap(GAP_PACKAGE_DURATION)

  tx.add_pulses(SECOND_PART, ONE_ON_DURATION, ONE_OFF_DURATION, ZERO_ON_DURATION, ZERO_OFF_DURATION)

  tx.add_carrier_frequency(ONE_ON_DURATION)

  # construct
  tx.construct_code()

  tx.send_code()

  while tx.is_busy():
    time.sleep(0.1)

  tx.delete_wave()

  pi.stop()
  
  print("Send IR DONE")
  
