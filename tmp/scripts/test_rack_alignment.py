import os

# With RACK_CENTER_Z = -0.60 and BASE_Y = 2.05:
rack_length = 2.20
rack_front_z = -0.60 + (rack_length / 2) # +0.50m
rack_rear_z = -0.60 - (rack_length / 2)  # -1.70m
base_y = 2.05

print(f"Rack Front Z: {rack_front_z:+.2f} m (Windshield top)")
print(f"Rack Rear Z:  {rack_rear_z:+.2f} m (Rear tailgate)")
print(f"Rack Base Y:  {base_y:.2f} m (Clears 2.014m roof apex by {base_y - 2.014:.3f} m)")

