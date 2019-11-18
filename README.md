==== 一、数据描述和分析 ====
本次作业数据选择为[[https://github.com/grapheco/InteractiveGraph/blob/master/dist/examples/honglou.json|《红楼梦》人物/地点/事件数据集]]，仅选取其中的人物关系进行展示。用顶点代表人物，边代表人物间存在的某些人际关系，共包含242个点和348条边。图较为稀疏，但点数较多，且《红楼梦》中人际关系较为复杂，表现起来可能有些难度。

==== 二、设计宗旨和设计过程 ====
使用node-link方式、力导向布局进行展示。起初采用Fruchterman and Reingold论文中的方法进行建模，发现存在收敛速度慢的问题。且由于引入全局的温度概念来控制各点的最大位移步长，导致有时出现全局温度已处于较低水平时，但部分节点仍需较大调整，最终布局不够美观的问题。

改进：参照[[https://link.springer.com/content/pdf/10.1007%2F3-540-58950-3_393.pdf|A Fast Adaptive Layout Algorithm for Undirected Graphs]]中的方法对算法进行了改进。具体思路：

顶点间的 optimal length: $k_{len}=k_{len\_c}\sqrt{\frac{width \times height}{|V|}}$

顶点间引力: $f_a(dist)=dist^2 / k_{len}$，斥力: $f_r(dist)={k_{len}^2} / dist$

对于每个顶点 $i$ 维护 local temperature $t_i$，初始值为 $t_max$ 。同时记录每个顶点上一时刻位移 $ldisp_i$ 和当前时刻位移 $disp_i$，记位移夹角 $\beta=<ldisp, disp>$，及skew gauge $d_i$。以两条规则进行顶点状态的更新：

1. oscillation:

若 $\beta$ 落在oscillation检测范围 $\alpha_{osc}$ 内，即 $|sin\beta|\geq sin(\frac{\alpha_{osc}}{2} + \frac{\pi}{2} )$ 时，则 $t_i=t_i\times(1+k_{osc}\times cos\beta)$

这条规则在顶点在两次位移方向基本相同时增大温度，使得顶点可以更快到达对应位置；在两次位移方向基本相反时减小温度，避免顶点不断来回震荡。

2. rotation: 

若 $\beta$ 落在rotation检测范围 $\alpha_{rot}$ 内，即 $|cos\beta|\geq cos \frac{\alpha_{rot}}{2}$ 时， 则 $d_i=d_i+k_{rot} \times sgn(sin\beta)$

最后根据 skew gauge 调整温度: $t_i=t_i\times(1 - |d_i|)$

这条规则使得不断旋转的顶点温度降低，摆脱不稳定的状态。

算法改进后，各顶点根据各自状态进行自适应式的调整，可以达到较快的收敛速度和较好的布局效果。

==== 三、可视化结果描述 ====
{{ :public_course:visclass_f19:assignment:a02:weilong:hw2_1.png |}}
{{ :public_course:visclass_f19:assignment:a02:weilong:hw2_2.png |}}
{{ :public_course:visclass_f19:assignment:a02:weilong:hw2_3.png |}}

