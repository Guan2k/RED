from pathlib import Path
import math
P=Path(__file__).parent
A=[12000,4501,4500,1501,1500,180,1,0]
def text(x,y,t,size=13,c='#dce5d7'):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{c}">{t}</text>'
def rect(x,y,w,h,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def ore(a,new):
 if not a:return ''
 n=1 if a<=1500 else 4 if a<=4500 else 8
 if not new:n=8
 z='<circle r="33" fill="#746544"/>'
 for i in range(n):z+=rect(math.cos(i*2.4)*22-4,math.sin(i*2.4)*21-5,9,12,'#c6b96d' if i%2 else '#e5d183')
 return z+text(-25,48,f'矿 {math.ceil(a/1000)}k',11,'#e2d692')
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="850"><style>text{font-family:"Noto Sans CJK SC",sans-serif}</style>',rect(0,0,1320,850,'#14211a'),text(24,36,'RED / 低余量矿点：保留原矿块，仅减少数量',24),text(24,65,'独立代码绘制概念 · 未修改正式版本 · 数值标签保留原有向上取整，块数仅表示绝对余量档位',14),text(24,90,'候选：余量 >4500 显示 8 块；1500<余量≤4500 显示 4 块；0<余量≤1500 显示 1 块；耗尽仍不绘制。',14)]
for i,a in enumerate(A):s.append(text(215+i*145,132,f'余量 {a}',12))
for j,(new,scale) in enumerate([(False,1),(True,1),(False,.5),(True,.5)]):
 y=205+j*130;s+=[rect(16,y-48,1288,122,'#34463a'),text(28,y-12,('候选' if new else '当前')+f' {scale:g}×'),text(28,y+13,'疏密分档' if new else '未耗尽均 8 块',12,'#e4ca87')]
 for i,a in enumerate(A):s.append(f'<g transform="translate({250+i*145} {y}) scale({scale})">'+ore(a,new)+'</g>')
s += [text(24,708,'观察：1× 的 8→4→1 疏密差明显；0.5× 每块约 4.5×6 像素，低档仍比原型单一密度更稀疏。',14),text(24,737,'限制：这不是玩家测试或原生 Canvas 截图；车辆遮挡、视力、缩放和背景都可能影响辨认。',14),text(24,766,'1 块仍有矿，0 块/不绘制才是耗尽；不能按块数推算剩余金额、满载车次或初始容量百分比。',14),text(24,795,'标签仍显示向上取整的 k：余量 1 和 180 仍为“矿 1k”；精确值继续通过悬停查看，未改经济规则。',14),text(24,824,'阈值只是本次美工候选：1500 约为当前开局量的 1/8，但绘制不读取或新增“初始容量”。',12),'</svg>']
(P/'comparison.svg').write_text(''.join(s))
