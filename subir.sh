#!/bin/bash
git remote add origin https://github.com/Jainkoa13/dinamo-scouting.git 2>/dev/null || git remote set-url origin https://github.com/Jainkoa13/dinamo-scouting.git
git add .
git commit -m "primera subida"
git push -u origin main
