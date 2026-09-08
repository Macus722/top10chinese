/**
 * ==============================================================================
 * Top10Chinese Insights Data Registry (Single Source of Truth)
 * ==============================================================================
 * 
 * 官方深度洞察文章数据库与单一事实来源 (Single Source of Truth)
 * 
 * 【未来添加新文章的操作指南 / WORKFLOW FOR ADDING A NEW ARTICLE】:
 * 1. 在 insights/<slug>.html 创建新文章页面
 * 2. 在下方 INSIGHTS_DATA 数组最前端添加该文章的对象元数据：
 *    {
 *      title: "文章标题",
 *      subtitle: "核心摘要（用于首页封面故事与卡片展示）",
 *      slug: "article-slug",
 *      url: "insights/article-slug.html",
 *      publicationDate: "YYYY-MM-DD", // 必须为标准ISO日期，系统严格按此日期排序
 *      readingTime: "15 MIN READ",
 *      category: "Industry / Technology",
 *      region: "china",
 *      image: "assets/images/insights/article-slug.webp", // 严格遵守零人物规则(Zero People)
 *      imageAlt: "视觉描述"
 *    }
 * 3. 在 insights.html 归档列表中增加对应卡片
 * 4. 首页 (index.html) 会自动读取此文件，严格按 publicationDate 降序排列：
 *    - 最新第 1 篇：自动作为【封面故事 COVER STORY】展示
 *    - 第 2、3、4 篇：自动作为【最新深度洞察 LATEST INSIGHTS】侧边栏展示
 *    - 同时自动同步更新首页 JSON-LD ItemList 结构化数据
 * 
 * 无需手动修改首页 HTML 卡片代码！
 * ==============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.INSIGHTS_REGISTRY = factory();
        root.INSIGHTS_DATA = root.INSIGHTS_REGISTRY.articles;
        root.getLatestInsights = root.INSIGHTS_REGISTRY.getLatest;
        root.getSortedInsights = root.INSIGHTS_REGISTRY.getSorted;
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const articles = [
    {
        "title": "港交所科技上市潮全面复苏：8个月募资破3400亿与18C特专科技红利",
        "subtitle": "深度解析前8个月港股IPO激增153%背后的硬科技支撑，特专科技制度放宽延期与中东中资双向资金汇流新生态。",
        "slug": "hkex-tech-ipo-revival-chapter-18c",
        "url": "insights/hkex-tech-ipo-revival-chapter-18c.html",
        "publicationDate": "2026-09-07",
        "readingTime": "14 MIN READ",
        "category": "Capital Flow / Region",
        "region": "hongkong",
        "image": "assets/images/insights/hkex-tech-ipo-revival-chapter-18c.webp",
        "imageAlt": "HKEX Tech IPO Revival"
    },
    {
        "title": "无锡CSEAC 2026半导体装备展：核心工具突破与千亿芯片出口倍增密码",
        "subtitle": "直击第14届无锡半导体装备展核心突破，中微70:1超高深宽比刻蚀与前8个月全国芯片出口暴涨103%的产业真相。",
        "slug": "cseac-2026-china-semiconductor-equipment",
        "url": "insights/cseac-2026-china-semiconductor-equipment.html",
        "publicationDate": "2026-09-04",
        "readingTime": "16 MIN READ",
        "category": "Industry / Technology",
        "region": "china",
        "image": "assets/images/insights/cseac-2026-china-semiconductor-equipment.webp",
        "imageAlt": "Semiconductor Fab Cleanroom"
    },
    {
        "title": "中国创新药出海黄金时代：双抗ADC重磅授权与跨国药企研发逻辑重置",
        "subtitle": "深度拆解康宁杰瑞与宜联生物8月数十亿美元全球授权协议，穿透首付现金与里程碑结构，洞察跨国药企专利悬崖下的中国红利。",
        "slug": "chinese-biotech-adc-global-licensing",
        "url": "insights/chinese-biotech-adc-global-licensing.html",
        "publicationDate": "2026-08-31",
        "readingTime": "15 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "china",
        "image": "assets/images/insights/chinese-biotech-adc-global-licensing.webp",
        "imageAlt": "Biopharma Cleanroom Laboratory"
    },
    {
        "title": "马来西亚AI数据中心热潮与电网承载边界：柔佛算力走廊的能源硬约束",
        "subtitle": "直击柔佛数据中心用电突破9.3%警戒红线背后的基建博弈，国家能源430亿电网扩建与东盟跨境绿色算力走廊格局重构。",
        "slug": "malaysia-data-center-boom-energy-grid",
        "url": "insights/malaysia-data-center-boom-energy-grid.html",
        "publicationDate": "2026-08-20",
        "readingTime": "15 MIN READ",
        "category": "Technology / Region",
        "region": "asean",
        "image": "assets/images/insights/malaysia-data-center-boom-energy-grid.webp",
        "imageAlt": "Johor Data Center Substation"
    },
    {
        "title": "开源权重走向全球前沿：通义千问、DeepSeek与中国大模型全栈推理范式重塑",
        "subtitle": "深度剖析Qwen与DeepSeek推理算力优化，中国开源权重如何凭借算法效率打破摩尔定律瓶颈，重构全球开发者生态。",
        "slug": "open-weight-ai-frontier-china",
        "url": "insights/open-weight-ai-frontier-china.html",
        "publicationDate": "2026-08-08",
        "readingTime": "15 MIN READ",
        "category": "Technology",
        "region": "china",
        "image": "assets/images/insights/open-weight-ai-frontier-china.webp",
        "imageAlt": "High-Density AI Supercomputing Cluster"
    },
    {
        "title": "中国—东盟产业链深层咬合：中间品贸易激增与跨境供应链制度型开放",
        "subtitle": "深度解析7个月中国东盟贸易激增24.7%与中间品占比66.8%背后的制度红利，原产地规则与跨境工业走廊重塑东亚分工。",
        "slug": "china-asean-intermediate-goods-trade",
        "url": "insights/china-asean-intermediate-goods-trade.html",
        "publicationDate": "2026-07-18",
        "readingTime": "15 MIN READ",
        "category": "Industry / Region",
        "region": "asean",
        "image": "assets/images/insights/china-asean-intermediate-goods-trade.webp",
        "imageAlt": "Automated Container Port Logistics"
    },
    {
        "title": "民用航空法修订奠基万亿低空经济：空域确权、适航取证与全自主货运航线商业化",
        "subtitle": "深度剖析7月1日新民用航空法实施背后的低空空域确权机制，eVTOL适航审定突破与中国低空经济全自主货运航线商业化落地。",
        "slug": "china-civil-aviation-law-low-altitude-economy",
        "url": "insights/china-civil-aviation-law-low-altitude-economy.html",
        "publicationDate": "2026-07-07",
        "readingTime": "16 MIN READ",
        "category": "Industry / Technology",
        "region": "china",
        "image": "assets/images/insights/china-civil-aviation-law-low-altitude-economy.webp",
        "imageAlt": "eVTOL Vertiport Urban Skyline"
    },
    {
        "title": "中东主权财富的东向资本支点：海湾主权基金战略布局中国硬科技与双向流动",
        "subtitle": "追踪PIF上海办事处设立与穆巴达拉25%亚洲配置战略，解构海湾万亿主权资本从单纯财务投资转向硬科技协同与新能源双向流动的底层逻辑。",
        "slug": "middle-east-sovereign-wealth-china-pivot",
        "url": "insights/middle-east-sovereign-wealth-china-pivot.html",
        "publicationDate": "2026-05-26",
        "readingTime": "15 MIN READ",
        "category": "Capital Flow / Region",
        "region": "china",
        "image": "assets/images/insights/middle-east-sovereign-wealth-china-pivot.webp",
        "imageAlt": "Institutional Sovereign Capital Architecture"
    },
    {
        "title": "日本公司治理深化与资本效率革命：东证PBR改革下半场与外资合规新规",
        "subtitle": "深度解析东证PBR破净整治下半场、FIEA金融商品交易法衍生品披露新规与外资合规边界，解构东亚资本效率觉醒对华人家族资本配置的启示。",
        "slug": "japan-governance-reforms-capital-efficiency",
        "url": "insights/japan-governance-reforms-capital-efficiency.html",
        "publicationDate": "2026-05-12",
        "readingTime": "15 MIN READ",
        "category": "Capital Flow / Region",
        "region": "japan",
        "image": "assets/images/insights/japan-governance-reforms-capital-efficiency.webp",
        "imageAlt": "Tokyo Financial District Boardroom"
    },
    {
        "title": "香港稳定币监管时代启幕：首批牌照发行人沙盒落地与数字港元生态构想",
        "subtitle": "深度解析香港金管局法币稳定币发行人沙盒监管细则、100%优质储备要求与跨境贸易代币化结算新纪元。",
        "slug": "hk-stablecoin-licensing-first-cohort",
        "url": "insights/hk-stablecoin-licensing-first-cohort.html",
        "publicationDate": "2026-04-18",
        "readingTime": "14 MIN READ",
        "category": "Capital Flow / Region",
        "region": "hongkong",
        "image": "assets/images/insights/hk-stablecoin-licensing-first-cohort.webp",
        "imageAlt": "Hong Kong Financial District Architecture"
    },
    {
        "title": "华人商业精英的成功方程式：家国情怀与全球抱负的百年传承密码",
        "subtitle": "华人商业精英的成功方程式：深度剖析从李嘉诚、郭鹤年到黄仁勋、马云，支撑一代代华人商业巨擘跨越历史周期、实现基业长青的核心战略逻辑与精神密码。 深度解析白手起家的华人企业家和华人商业领袖 成功故事的商业故事与最新动态。",
        "slug": "chinese-business-elite-success-formula",
        "url": "insights/chinese-business-elite-success-formula.html",
        "publicationDate": "2026-03-10",
        "readingTime": "14 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-business-elite-success-formula.webp",
        "imageAlt": "华人商业精英的成功方程式：家国情怀与全球抱负的百年传承密码"
    },
    {
        "title": "马化腾与腾讯：构建连接亿万人的社交与数字娱乐帝国及海外数智转型",
        "subtitle": "马化腾与腾讯：构建连接亿万人的社交与数字娱乐帝国及海外数智转型。深度剖析马化腾如何通过微信生态、数字支付及泛娱乐大版图，重塑全球华人数字连接秩序。 深度解析华人科技企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "pony-ma-tencent-social-empire",
        "url": "insights/pony-ma-tencent-social-empire.html",
        "publicationDate": "2026-02-25",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/pony-ma-tencent-social-empire.webp",
        "imageAlt": "马化腾与腾讯：构建连接亿万人的社交与数字娱乐帝国及海外数智转型"
    },
    {
        "title": "马云与阿里巴巴：中国电商与数字支付的开创者及新全球化征程",
        "subtitle": "马云与阿里巴巴：中国电商与数字支付的开创者及新全球化征程。深度剖析马云如何通过淘宝、支付宝及菜鸟物流，重塑全球数字交易与信贷生态秩序。 深度解析华人科技企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "jack-ma-alibaba-ecommerce-revolution",
        "url": "insights/jack-ma-alibaba-ecommerce-revolution.html",
        "publicationDate": "2026-02-22",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/jack-ma-alibaba-ecommerce-revolution.webp",
        "imageAlt": "马云与阿里巴巴：中国电商与数字支付的开创者及新全球化征程"
    },
    {
        "title": "郭鹤年的商业帝国：糖王的多元化经营艺术与百年长青的地缘红利",
        "subtitle": "郭鹤年的商业帝国：糖王的多元化经营艺术与百年长青的地缘红利。深度剖析郭氏集团如何依托食品供应链、酒店（香格里拉）及航运基建，在长周期配置中实现绝对稳定。 深度解析马来西亚华人富豪排行榜和东南亚华人企业家的商业故事与最新动态。",
        "slug": "robert-kuok-sugar-king-legacy",
        "url": "insights/robert-kuok-sugar-king-legacy.html",
        "publicationDate": "2026-02-20",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/robert-kuok-sugar-king-legacy.webp",
        "imageAlt": "郭鹤年的商业帝国：糖王的多元化经营艺术与百年长青的地缘红利"
    },
    {
        "title": "李嘉诚商业帝国的周期抗性与全球化打法：公用事业卡位与逆周期防御的资本圣经",
        "subtitle": "李嘉诚商业帝国的周期抗性与全球化打法：公用事业卡位与逆周期防御的资本圣经。深度剖析李嘉诚家族如何通过在全球配置水务、电网、电信与零售等高壁垒刚需基建，实现穿越多次世纪危机的超凡稳定性。 深度解析华人地产大亨和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "li-ka-shing-business-empire",
        "url": "insights/li-ka-shing-business-empire.html",
        "publicationDate": "2026-02-15",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/li-ka-shing-business-empire.webp",
        "imageAlt": "李嘉诚商业帝国的周期抗性与全球化打法：公用事业卡位与逆周期防御的资本圣经"
    },
    {
        "title": "下一个十年：最具爆发力的华人科技独角兽与硬核科技的边际突破",
        "subtitle": "下一个十年：最具爆发力的华人科技独角兽与硬核科技的边际突破。深度剖析在人工智能算法、先进储能、具身智能及量子计算赛道中，正崭露头角的十家华人独角兽。 深度解析华人科技企业家的商业故事与最新动态。",
        "slug": "chinese-tech-unicorns-next-decade",
        "url": "insights/chinese-tech-unicorns-next-decade.html",
        "publicationDate": "2026-02-10",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-tech-unicorns-next-decade.webp",
        "imageAlt": "下一个十年：最具爆发力的华人科技独角兽与硬核科技的边际突破"
    },
    {
        "title": "华人领跑全球新能源汽车供应链：硬核制造、全球合规与出海大航海",
        "subtitle": "华人领跑全球新能源汽车供应链：硬核制造、全球合规与出海大航海。深度剖析在全球绿色转型大潮中，以雷军（小米）、曾毓群（宁德时代）为代表的华人巨头如何掌控全球新能源关键脉搏。 深度解析华人科技企业家的商业故事与最新动态。",
        "slug": "chinese-ev-industry-global-rise",
        "url": "insights/chinese-ev-industry-global-rise.html",
        "publicationDate": "2026-02-05",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-ev-industry-global-rise.webp",
        "imageAlt": "华人领跑全球新能源汽车供应链：硬核制造、全球合规与出海大航海"
    },
    {
        "title": "张一鸣与字节跳动：中国算法的全球化征途与流量秩序重塑",
        "subtitle": "张一鸣与字节跳动：中国算法的全球化征途与流量秩序重塑。深度剖析字节跳动如何凭借极致推荐算法引擎打破西方流量巨头垄断，重塑全球数字社交版图。 深度解析华人科技企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "zhang-yiming-bytedance-tiktok",
        "url": "insights/zhang-yiming-bytedance-tiktok.html",
        "publicationDate": "2026-02-01",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/zhang-yiming-bytedance-tiktok.webp",
        "imageAlt": "张一鸣与字节跳动：中国算法的全球化征途与流量秩序重塑"
    },
    {
        "title": "全球半导体产业链中的华人力量：从设计上游到OSAT封测的枢纽生态",
        "subtitle": "全球半导体产业链中的华人力量：从设计上游到OSAT封测的枢纽生态。深度剖析在全球芯片大重组周期中，华人科学家、管理者与资本如何在EDA、先进制程与先进封装节点构筑关键底座。 深度解析华人科技企业家的商业故事与最新动态。",
        "slug": "chinese-semiconductor-leaders",
        "url": "insights/chinese-semiconductor-leaders.html",
        "publicationDate": "2026-01-28",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-semiconductor-leaders.webp",
        "imageAlt": "全球半导体产业链中的华人力量：从设计上游到OSAT封测的枢纽生态"
    },
    {
        "title": "黄仁勋与英伟达：算力之巅的华人巨擘与硅基文明的开创者",
        "subtitle": "黄仁勋与英伟达：算力之巅的华人巨擘与硅基文明的开创者。深度剖析黄仁勋如何通过CUDA生态与先进GPU设计，主导全球人工智能芯片与算力霸权。 深度解析华人科技企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "jensen-huang-nvidia-ai-revolution",
        "url": "insights/jensen-huang-nvidia-ai-revolution.html",
        "publicationDate": "2026-01-25",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/jensen-huang-nvidia-ai-revolution.webp",
        "imageAlt": "黄仁勋与英伟达：算力之巅的华人巨擘与硅基文明的开创者"
    },
    {
        "title": "华人超高净值群体的财富守恒定律：物理资产防线与全球流动性的二次锚定",
        "subtitle": "华人超高净值群体的财富守恒定律：物理资产防线与全球流动性的二次锚定。深度剖析在全球高通胀与地缘波动常态化下，华人顶级富豪如何通过大宗实业、反周期基建卡位资产守恒。 深度解析白手起家的华人企业家和华人商业领袖 成功故事的商业故事与最新动态。",
        "slug": "chinese-billionaire-wealth-strategies",
        "url": "insights/chinese-billionaire-wealth-strategies.html",
        "publicationDate": "2026-01-20",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-billionaire-wealth-strategies.webp",
        "imageAlt": "华人超高净值群体的财富守恒定律：物理资产防线与全球流动性的二次锚定"
    },
    {
        "title": "中国本土资本与东南亚华商的协同效应：构建地缘合规与实体赋能的联合大航海舰队",
        "subtitle": "中国本土资本与东南亚华商的协同效应：构建地缘合规与实体赋能的联合大航海舰队。深度剖析中国高新技术出海企业与东南亚扎根百年的顶尖华商家族如何携手共拓全球市场。 深度解析东南亚华人企业家的商业故事与最新动态。",
        "slug": "china-capital-southeast-asia",
        "url": "insights/china-capital-southeast-asia.html",
        "publicationDate": "2026-01-15",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/china-capital-southeast-asia.webp",
        "imageAlt": "中国本土资本与东南亚华商的协同效应：构建地缘合规与实体赋能的联合大航海舰队"
    },
    {
        "title": "华人企业全球 IPO 与资本退路选择：多边监管下的估值重塑与上市路径重划",
        "subtitle": "华人企业全球 IPO 与资本退路选择：多边监管下的估值重塑与上市路径重划。深度剖析在全球IPO市场分化、多边反洗钱与穿透监管常态化下，华人高新科技与制造巨头如何卡位资本通道。 深度解析全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "chinese-company-ipo-strategy",
        "url": "insights/chinese-company-ipo-strategy.html",
        "publicationDate": "2026-01-10",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-company-ipo-strategy.webp",
        "imageAlt": "华人企业全球 IPO 与资本退路选择：多边监管下的估值重塑与上市路径重划"
    },
    {
        "title": "华人家族办公室资产配置新趋势：物理防波堤与绿色溢价的共谋",
        "subtitle": "华人家族办公室资产配置新趋势：物理防波堤与绿色溢价的共谋。深度剖析在全球财富避险常态化周期中，华人家族办公室如何重新划定其在公用事业、硬核科技及ESG资产上的投资版图。 深度解析白手起家的华人企业家和华人商业领袖 成功故事的商业故事与最新动态。",
        "slug": "chinese-family-office-investment-trends",
        "url": "insights/chinese-family-office-investment-trends.html",
        "publicationDate": "2026-01-05",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-family-office-investment-trends.webp",
        "imageAlt": "华人家族办公室资产配置新趋势：物理防波堤与绿色溢价的共谋"
    },
    {
        "title": "东南亚华人资本的下一个十年：物理锚定、数智跃迁与区域共存生态",
        "subtitle": "东南亚华人资本的下一个十年：物理锚定、数智跃迁与区域共存生态。深度剖析在东盟经济崛起的新十年，华人跨国资本如何通过与高新科技结合实现产业再升级。 深度解析东南亚华人企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "southeast-asia-chinese-capital-2026",
        "url": "insights/southeast-asia-chinese-capital-2026.html",
        "publicationDate": "2025-12-30",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/southeast-asia-chinese-capital-2026.webp",
        "imageAlt": "东南亚华人资本的下一个十年：物理锚定、数智跃迁与区域共存生态"
    },
    {
        "title": "华人家族企业传承的制度创新：家族信托与双重公司架构的交叠运用",
        "subtitle": "华人家族企业传承的制度创新：家族信托与双重公司架构的交叠运用。深度剖析在全球反避税合规（CRS/CbCR）时代，华人家族企业如何运用双层信托与多级控股结构化解传承与控制权矛盾。 深度解析白手起家的华人企业家和华人商业领袖 成功故事的商业故事与最新动态。",
        "slug": "chinese-family-business-succession",
        "url": "insights/chinese-family-business-succession.html",
        "publicationDate": "2025-12-28",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/chinese-family-business-succession.webp",
        "imageAlt": "华人家族企业传承的制度创新：家族信托与双重公司架构的交叠运用"
    },
    {
        "title": "新加坡华人商业精英的全球视野：以合规底座与财富智库筑牢出海安全锚",
        "subtitle": "新加坡华人商业精英的全球视野：以合规底座与财富智库筑牢出海安全锚。深度剖析新加坡顶尖华商领袖与专业机构如何协助全球华人资本实现长效增值与地缘避险。 深度解析新加坡华人首富 2026和东南亚华人企业家的商业故事与最新动态。",
        "slug": "singapore-chinese-business-elite",
        "url": "insights/singapore-chinese-business-elite.html",
        "publicationDate": "2025-12-25",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/singapore-chinese-business-elite.webp",
        "imageAlt": "新加坡华人商业精英的全球视野：以合规底座与财富智库筑牢出海安全锚"
    },
    {
        "title": "香港华商传奇与基业长青：在周期律、制度红利与全球变局下的资产韧性",
        "subtitle": "香港华商传奇与基业长青：在周期律、制度红利与全球变局下的资产韧性。深度剖析以李嘉诚为代表的香港顶级华商家族如何穿越多次全球危机，构建长青基业。 深度解析华人地产大亨和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "hong-kong-chinese-business-legacy",
        "url": "insights/hong-kong-chinese-business-legacy.html",
        "publicationDate": "2025-12-20",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/hong-kong-chinese-business-legacy.webp",
        "imageAlt": "香港华商传奇与基业长青：在周期律、制度红利与全球变局下的资产韧性"
    },
    {
        "title": "马来西亚华商中流砥柱：在资源、资本与多元文化中的长效守望",
        "subtitle": "马来西亚华商中流砥柱：在资源、资本与多元文化中的长效守望。深度剖析以郭鹤年、郭令灿、谢富年为代表的马来西亚杰出华商领袖，如何历经时代变迁依然挺立在区域经济潮头。 深度解析马来西亚华人富豪排行榜和东南亚华人企业家的商业故事与最新动态。",
        "slug": "malaysia-chinese-business-leaders",
        "url": "insights/malaysia-chinese-business-leaders.html",
        "publicationDate": "2025-12-15",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/malaysia-chinese-business-leaders.webp",
        "imageAlt": "马来西亚华商中流砥柱：在资源、资本与多元文化中的长效守望"
    },
    {
        "title": "2026全球十大华人科技领袖：以自主创新定义物理世界的未来",
        "subtitle": "2026全球十大华人科技领袖：以自主创新定义物理世界的未来。深度盘点在芯片设计、EDA软件、大模型推荐算法与智能制造等前沿赛道中，引领世界科技方向的十位杰出华人领袖。 深度解析华人科技企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "top-10-global-chinese-tech-leaders-2026",
        "url": "insights/top-10-global-chinese-tech-leaders-2026.html",
        "publicationDate": "2025-12-10",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/top-10-global-chinese-tech-leaders-2026.webp",
        "imageAlt": "2026全球十大华人科技领袖：以自主创新定义物理世界的未来"
    },
    {
        "title": "家族传承与代际过渡：2026华人家族办公室的制度化破局",
        "subtitle": "家族传承与代际过渡：2026华人家族办公室的制度化破局。深度剖析在全球财富交接的窗口期，华人家族企业如何通过信托架构与现代治理防范代际流失风险。 深度解析白手起家的华人企业家和华人商业领袖 成功故事的商业故事与最新动态。",
        "slug": "generational-succession-2026",
        "url": "insights/generational-succession-2026.html",
        "publicationDate": "2025-12-05",
        "readingTime": "14 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/generational-succession-2026.webp",
        "imageAlt": "家族传承与代际过渡：2026华人家族办公室的制度化破局"
    },
    {
        "title": "可持续发展作为全新商业通用货币：华人实业的绿色转型战略",
        "subtitle": "可持续发展作为全新商业通用货币：华人实业的绿色转型战略。深度剖析在全球碳中和与ESG合规重塑的商业秩序中，华人跨国实业集团如何实现可持续发展与盈利飞轮的融合。 深度解析白手起家的华人企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "sustainability-as-currency",
        "url": "insights/sustainability-as-currency.html",
        "publicationDate": "2025-11-30",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/sustainability-as-currency.webp",
        "imageAlt": "可持续发展作为全新商业通用货币：华人实业的绿色转型战略"
    },
    {
        "title": "AI 时代华人科技领袖：算力、算法与硬核基建的全球博弈",
        "subtitle": "AI 时代华人科技领袖：算力、算法与硬核基建的全球博弈。深度剖析在全球人工智能核心产业链中，华人领袖如何掌控GPU算力设计、EDA软件及算法生态。 深度解析华人科技企业家的商业故事与最新动态。",
        "slug": "ai-chinese-tech-leaders",
        "url": "insights/ai-chinese-tech-leaders.html",
        "publicationDate": "2025-11-28",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/ai-chinese-tech-leaders.webp",
        "imageAlt": "AI 时代华人科技领袖：算力、算法与硬核基建的全球博弈"
    },
    {
        "title": "2026全球财富大位移：华人资本为何正集体涌入东南亚？",
        "subtitle": "2026全球财富大位移：华人资本为何正集体涌入东南亚？深度剖析全球地缘变局、税收合规风暴下，华人超高净值群体与家族办公室资产重配新加坡与东盟的深层原因。 深度解析东南亚华人企业家和全球十大华人企业家排名 2026的商业故事与最新动态。",
        "slug": "global-wealth-shift-2026",
        "url": "insights/global-wealth-shift-2026.html",
        "publicationDate": "2025-11-25",
        "readingTime": "15 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/global-wealth-shift-2026.webp",
        "imageAlt": "2026全球财富大位移：华人资本为何正集体涌入东南亚？"
    },
    {
        "title": "亚洲文旅新极点：澳门非博彩高能物业的资本飞轮逻辑",
        "subtitle": "亚洲文旅新极点：澳门非博彩高能物业的资本飞轮逻辑。深度剖析澳门在转型世界旅游休闲中心过程中，非博彩综合度假物业的资本运作、运营效率与商业模式变革。 深度解析华人地产大亨的商业故事与最新动态。",
        "slug": "macau-non-gaming-capital",
        "url": "insights/macau-non-gaming-capital.html",
        "publicationDate": "2025-11-22",
        "readingTime": "13 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/macau-non-gaming-capital.webp",
        "imageAlt": "亚洲文旅新极点：澳门非博彩高能物业的资本飞轮逻辑"
    },
    {
        "title": "生成式 AI 与供应链重塑：消除跨国底层制造的物理阻力",
        "subtitle": "生成式 AI 与供应链重塑：消除跨国底层制造的物理阻力。深度剖析大模型与生成式 AI 在跨国供应链、精益制造与物流仓储调度中的划时代变革。 深度解析华人科技企业家的商业故事与最新动态。",
        "slug": "generative-ai-supply-chain",
        "url": "insights/generative-ai-supply-chain.html",
        "publicationDate": "2025-11-20",
        "readingTime": "14 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/generative-ai-supply-chain.webp",
        "imageAlt": "生成式 AI 与供应链重塑：消除跨国底层制造的物理阻力"
    },
    {
        "title": "东盟基建革命：泛亚走廊与华人实业的百年战略锚定",
        "subtitle": "东盟基建革命：泛亚走廊与华人实业的百年战略锚定。深度剖析泛亚铁路打通后对全球制造业版图与大宗商品的重塑。 深度解析东南亚华人企业家和华人地产大亨的商业故事与最新动态。",
        "slug": "asean-infrastructure-revolution",
        "url": "insights/asean-infrastructure-revolution.html",
        "publicationDate": "2025-11-18",
        "readingTime": "12 MIN READ",
        "category": "Industry / Capital Flow",
        "region": "",
        "image": "assets/images/insights/asean-infrastructure-revolution.webp",
        "imageAlt": "东盟基建革命：泛亚走廊与华人实业的百年战略锚定"
    },
    {
        "title": "重新定义全球 SEO：从流量的‘竞逐者’，进化为屏幕的‘统治者’",
        "subtitle": "深入剖析 Prism Media 如何利用搜索网络防御体系，为华人企业在全球市场构建极其高昂的资本与信任双重壁垒。",
        "slug": "insight-brandthirty",
        "url": "insight-brandthirty.html",
        "publicationDate": "2025-01-11",
        "readingTime": "10 MIN READ",
        "category": "Technology / Capital Flow",
        "region": "",
        "image": "assets/images/prism_media.jpg",
        "imageAlt": "Google Screen Domination"
    }
];

    function getSorted() {
        return articles.slice().sort(function (a, b) {
            return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        });
    }

    function getLatest(limit) {
        const sorted = getSorted();
        return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    }

    return {
        articles: articles,
        getSorted: getSorted,
        getLatest: getLatest
    };
}));
