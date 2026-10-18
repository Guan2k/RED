from pathlib import Path
P=Path(__file__).parent
W,H=1560,1310
s=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">', '<title>RED FRONT vehicle art concept, not a game screenshot</title>', '<desc>Five vehicle silhouettes, two teams, three status conditions on three terrains at native, three-quarter and half scale. Concept only.</desc>', '<style>text{font-family:"Noto Sans CJK SC",sans-serif} .label{fill:#c5cec4;font-size:12px}.dim{fill:#94a79c;font-size:11px}</style>']
def rect(x,y,w,h,c,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}"/>'
def text(x,y,t,c='#e4e6d7',size=14):return f'<text x="{x}" y="{y}" fill="{c}" font-size="{size}">{t}</text>'
def path(d,c,stroke=None,width=1):return f'<path d="{d}" fill="{c}"'+(f' stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"' if stroke else '')+'/>'
types=['tank','scout','artillery','repair','harvester']; labels=['主战坦克','侦察战车','自行火炮','战地维修车','采矿车']; radii=[13,10,14,13,16]
s.append('<defs>')
for team in [0,1]:
 base,hi,deep=('#75977c','#a4b49a','#405c49') if team==0 else ('#a66755','#d19b7e','#6f4038')
 for kind,r in zip(types,radii):
  z=[f'<g id="{kind}{team}">',rect(-r+1,-r+3,r*2,r*2,'#101914',3)]
  if kind=='scout':
   for x in [-8,3]:
    for y in [-10,6]:z.append(rect(x,y,6,4,'#161f1c',1))
   z += [path('M -9 -6 L 4 -7 L 10 -3 L 10 3 L 4 7 L -9 6 Z',base,'#192821',1.2),path('M -7 -5 L 2 -5 L 5 -2 L -7 -2 Z',hi),rect(-4,-3,8,6,deep,1),rect(2,-1.5,15,3,'#ccd0b5')]
  else:
   for y in [-r,r-5]:
    z.append(rect(-r,y,r*2,5,'#19241f',1))
    for x in range(-r+1,r-1,5):z.append(rect(x,y+1,2,3,'#596658'))
   if kind=='tank':
    z += [path('M -12 -8 L 7 -8 L 13 -4 L 13 4 L 7 8 L -12 8 Z',base,'#17271e',1),rect(-10,-7,14,2,hi),path('M -6 -6 L 4 -6 L 8 -2 L 8 3 L 3 6 L -6 5 Z',deep,'#a4b49a',.7),rect(3,-2,21,4,'#b5bea6'),rect(20,-2.5,4,5,deep)]
   elif kind=='artillery':
    z += [path('M -13 -9 L 9 -9 L 14 -5 L 14 5 L 9 9 L -13 9 Z',base,'#17271e',1),rect(-11,-8,14,2,hi),rect(-12,-7,12,14,deep,1),rect(-9,-5,7,10,hi,1),rect(-2,-2.5,36,5,'#c0c7ab'),rect(29,-3.5,5,7,deep)]
   elif kind=='repair':
    z += [path('M -12 -8 L 5 -8 L 13 -4 L 13 5 L 6 8 L -12 8 Z',base,'#17271e',1),rect(-10,-7,15,14,'#b4c5ab',1),rect(7,-3,4,6,deep),path('M -6 -5 L -3 -2 L 0 -5 M -3 -2 L -6 4', 'none',deep,2),path('M -10 7 L -10 10 L 3 10 L 6 7','none','#d9bd77',2)]
   else:
    z += [rect(-15,-10,23,20,base,2),rect(-13,-8,17,16,deep,1),rect(-12,-7,15,2,hi),rect(-10,-3,5,6,'#b59b60',1),rect(-4,-5,6,9,'#d0b16f',1),rect(8,-9,7,18,'#c6ab6b',1),path('M 10 -10 L 10 10 M 13 -10 L 13 10','none','#524f38',1),rect(-12,8,17,2,'#e1c379')]
  # Common independent team badge: double stripe vs triangular pennant, placed on upper rear hull.
  if team==0:z += [rect(-9,-6,2,5,'#f0e9cf'),rect(-5,-6,2,5,'#f0e9cf')]
  else:z.append(path('M -9 -6 L -3 -3.5 L -9 -1 Z','#f0e9cf'))
  z.append('</g>');s.extend(z)
s.append('</defs>')
s.append(rect(0,0,W,H,'#111b18'))
s += [text(32,39,'RED / FRONT', '#e9aa84',23), text(250,39,'装甲辨识 · 第一轮美术方向',size=23),text(32,69,'概念造型，非游戏截图','#e2c480',17),text(32,92,'代码原生 SVG · 未修改游戏 · 未验证浏览器布局或 FPS · 向右为当前统一朝向',size=12)]
s.append(rect(32,112,1496,203,'#202e27',8))
for i,(kind,label,r) in enumerate(zip(types,labels,radii)):
 x=145+i*295
 s += [text(x-65,139,label,size=16),f'<g transform="translate({x-28} 204) scale(3)"><use xlink:href="#{kind}0"/></g>',f'<g transform="translate({x+79} 202) scale(1.4)"><use xlink:href="#{kind}1"/></g>',text(x-72,280,['宽履带 / 切角炮塔','轮式 / 窄车头','后炮座 / 长炮管','工具舱 / 维修吊臂','货斗 / 采矿头'][i],size=12),text(x-72,300,f'大图 3× · 原逻辑半径 {r} 保持', '#93aa99',11)]
s += [text(32,347,'实际尺寸对照：每组依次为 坦克 / 侦察 / 火炮 / 维修 / 矿车',size=17),text(32,372,'双短条 = 友军；三角 = 敌军。浅色角括号 = 选中；橙色虚线警示 + 短血条 = 低血量。','#bfcdbf',12)]
terrains=[('林地 / FIELD','#34463a','#3d5041','#56644a'),('干旱 / DUST','#514c3d','#5b5543','#70654c'),('岩地 / SLATE','#3b4649','#444e50','#59645b')]
for ti,(title,bg,accent,road) in enumerate(terrains):
 px=32+ti*504
 s += [rect(px,391,488,827,bg,6),text(px+16,420,title,'#e5e4d3',16)]
 for i,label in enumerate(['坦克','侦察','火炮','维修','矿车']):s.append(text(px+110+i*75,445,label,'#d0d5c6',11))
 for si,scale in enumerate([1,.75,.5]):
  by=460+si*247
  s += [rect(px+8,by,472,24,'#15251e'),text(px+17,by+17,f'{scale:g}×  /  '+['原生地图单位尺寸','缩放至 75%','缩放至 50%'][si],'#e5cf9d',12)]
  for row in range(6):
   team=row//3; status=row%3; y=by+45+row*35
   # subtle local patches and a shared road keep terrain intentional without false screenshot claims
   if row%2==0:s.append(rect(px+95,y-17,383,33,accent))
   s.append(rect(px+280,y-17,50,33,road))
   s.append(text(px+16,y+4,('友' if team==0 else '敌')+' · '+['常态','选中','低血'][status], '#b7c9b5' if team==0 else '#e2b19d',11))
   for i,(kind,r) in enumerate(zip(types,radii)):
    x=px+126+i*75
    s.append(f'<g transform="translate({x} {y}) scale({scale})"><use xlink:href="#{kind}{team}"/>')
    if status==1:
     a=r+5;b=a-5
     d=f'M {-a} {-b} V {-a} H {-b} M {b} {-a} H {a} V {-b} M {a} {b} V {a} H {b} M {-b} {a} H {-a} V {b}'
     s += [path(d,'none','#17251e',4),path(d,'none','#f0e8cd',2)]
    if status==2:
     s += [f'<circle r="{r+5}" fill="none" stroke="#e7a167" stroke-width="1.5" stroke-dasharray="3 4"/>',rect(-r,-r-10,2*r,4,'#111b17'),rect(-r,-r-10,2*r*.23,4,'#e7a167')]
    s.append('</g>')
s += [text(32,1246,'评审重点：先看轮廓、敌我、选中，再决定纹理与细节。0.5× 下细小队徽可能失读，需浏览器实测后调整。','#e0c78e',14),text(32,1273,'保持碰撞半径、e.angle、武器判定与存档不变；无随机数、无外部素材、无运行时滤镜。地形仅作对比底色，并非实际地图。','#a9bcac',12),'</svg>']
(P/'red-vehicle-art-concept.svg').write_text('\n'.join(s))
