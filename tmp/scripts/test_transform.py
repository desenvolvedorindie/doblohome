import math

# We want:
# SketchUp (X_sk, Y_sk, Z_sk):
# Center X = 11424.40 mm -> target X = 0
# Front Y = +1891.94, Rear Y = -2578.20 -> Center Y = -343.13 mm -> target Z = +center (front towards +Z)
# Ground Z = 2.75 mm -> target Y = 0
# Roof Z = 2017.07 mm -> target Y = ~1.85m to 2.01m

# If we offset vertices before rotation:
# X_rel = (X_sk - 11424.40) * 0.001
# Y_rel = (Y_sk - (-343.13)) * 0.001
# Z_rel = (Z_sk - 2.75) * 0.001

# Then:
# In Three.js:
# Three X = X_rel
# Three Y = Z_rel  (Ground is 0, Roof is 2.014m)
# Three Z = Y_rel  (Front is +1.89 - (-0.34) = +2.23m, Rear is -2.57 - (-0.34) = -2.23m)

print("Three.js Coordinates:")
print("Ground center:", (0, 0, 0))
print("Roof apex:", (0, 2.014, 0))
print("Front bumper:", (0, 0.30, 2.23))
print("Rear tailgate:", (0, 0.65, -2.23))
print("Left mirror:", (-1.07, 1.0, 0))
print("Right mirror:", (1.07, 1.0, 0))

