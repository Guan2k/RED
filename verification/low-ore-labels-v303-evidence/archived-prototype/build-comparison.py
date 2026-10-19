from pathlib import Path
import math,html
P=Path(__file__).parent
A=[.1,1,180,999,999.5,1000,1001,0]
def text(x,y,t,size=13,c='#dce5d7'):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{c}">{html.escape(t)}</text>'
def rect(x,y,w,h,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def ore(a,new):
 if not a:return ''
 n=1 if a<=1500 else 4 if a<=4500 else 8
 z='<circle r="33" fill="#746544"/>'
 for i in range(n):z+=rect(math.cos(i*2.4)*22-4,math.sin(i*2.4)*21-5,9,12,'#c6b96d' if i%2 else '#e5d183')
 label=str(math.ceil(a)) if new and a<1000 else str(math.ceil(a/1000))+'k'
 return z+text(-25,48,'矿 '+label,11,'#e2d692')
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="850"><style>text{font-family:"Noto Sans CJK SC",sans-serif}</style>',rect(0,0,1320,850,'#14211a'),text(24,36,'RED / 低余量矿点：不足 1000 时显示整数',24),text(24,65,'独立代码绘制概念 · 未修改正式 v302 · 保留 8/4/1 疏密，标签仍向上取整，不显示精确小数',14),text(24,90,'候选：0<余量<1000 显示向上取整的单位数；余量≥1000 保留原 k 规则；耗尽仍不绘制。',14)]
for i,a in enumerate(A):s.append(text(215+i*145,132,f'余量 {a}',12))
for j,(new,scale) in enumerate([(False,1),(True,1),(False,.5),(True,.5)]):
 y=205+j*130;s+=[rect(16,y-48,1288,122,'#34463a'),text(28,y-12,('候选' if new else '当前')+f' {scale:g}×'),text(28,y+13,'小余量整数' if new else '原 k 标签',12,'#e4ca87')]
 for i,a in enumerate(A):s.append(f'<g transform="translate({250+i*145} {y}) scale({scale})">'+ore(a,new)+'</g>')
s += [text(24,708,'观察：1× 能区分余量 1 / 180 / 999；0.5× 字号仅 5.5 像素，数字阅读仍弱，不保证一眼读清。',14),text(24,737,'限制：这不是玩家测试或原生 Canvas 截图；车辆遮挡、视力、缩放和背景都可能影响辨认。',14),text(24,766,'999.5 显示“矿 1000”，1000 显示“矿 1k”；格式边界会切换，均不承诺精确小数或可采时间。',14),text(24,795,'标签宽度改变可能触发原有候选位置 / 边缘 clamp；实际回放继续使用 measureText，没有手调位置。',14),text(24,824,'矿块、颜色、半径、经济与悬停均不改。此页隔离比较字样；原有重叠回退限制仍保留。',12),'</svg>']
(P/'comparison.svg').write_text(''.join(s))
