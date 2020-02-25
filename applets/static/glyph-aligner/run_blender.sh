PATH=$PATH:/usr/bin:/bin:/home/svis/blender/blender-2.79b-linux-glibc219-x86_64
echo "XXXXXXXXXXXXX RUN BLENDER! YYYYYYYYYYYYYY"  $* > /tmp/BLENDER_MSG
/bin/env >> /tmp/BLENDER_MSG
which blender >> /tmp/BLENDER_MSG

blender --background --python $1 -- $2 $3 10000 1000 100 2>&1 >> /tmp/BLENDER_MSG
