node index.js # downloads latest
find . -name "*.png" -size -1k -delete # if last ran exited w/ half written files
ls images | xargs -I {} sh -c "if [ ! -f renders/{}.png ]; then montage images/{}/*.png -tile 3x3 -geometry +0+0 -background none renders/{}.png; fi"
for f in renders/*.png; do
  filename=$(basename $f .JPG)
  if [ ! -f overlay/$filename ]; then
    convert $f -fill white -pointsize 30 -gravity NorthWest -draw "text 10,10 '$(node date.js $filename)'" -pointsize 20 -draw "text 10,50 'CIRA GeoColor, NASA GOES-16 Satellite'" overlay/$filename
  fi;
done
rm -rf movietmp
mkdir movietmp
ls overlay | tail -n -96 | xargs -I {} cp overlay/{} movietmp # only build last 96 (last 24 hours worth)
ffmpeg -y -r 5 -pattern_type glob -i 'movietmp/*.png' -vf scale=2034:-1 -vcodec libx264 -crf 25 output/24hrs.mp4
cp index.html output/
