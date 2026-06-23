/**
 * @file 聊天对话 Mock 数据
 * @description 提供亚果蔬 AI 助手对话页的全部模拟数据，包括：
 *   - chatPrompts：欢迎态快捷提示词卡片列表
 *   - recentChatSessions：最近会话标题列表
 *   - initialMessages：首次进入页面时的欢迎消息
 *   - 多主题 Mock 回答：病害防治、花期管理、品种查询、政策查询等
 *   - createMockAnswer：根据用户提问关键词匹配对应 Mock 回答
 */
import type { ChatMessage, PromptCard } from '@/types/chat';

/** 欢迎态快捷提示词 —— 三枚胶囊按钮的内容与配色 */
export const chatPrompts: PromptCard[] = [
  {
    title: '芒果/荔枝等亚热带果蔬种植技术',
    description: '查询亚热带果蔬种植管理与关键农艺措施',
    prompt: '芒果花期管理有哪些关键技术？',
    color: '#28d881',  // 绿色光晕
  },
  {
    title: '亚热带果蔬品种有哪些',
    description: '了解主栽品种、适宜区域和生产特性',
    prompt: '亚热带果蔬常见品种有哪些？',
    color: '#f7b84b',  // 金色光晕
  },
  {
    title: '广西惠农政策有哪些',
    description: '检索政策文件并总结适用条件',
    prompt: '广西果蔬种植补贴政策有哪些？',
    color: '#1f8bff',  // 蓝色光晕
  },
];

/** 最近会话标题列表 —— 侧边栏"最近对话"展示 */
export const recentChatSessions = [
  '芒果炭疽病防治',
  '荔枝花果期管理',
  '果蔬补贴政策',
];

/** 初始欢迎消息 —— 进入聊天页时 AI 助手的开场白 */
export const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      '您好，我是农业知识 AI 助手。您可以询问种植技术、病虫害防治、惠农政策、专家资料和知识库文档内容。',
  },
];

/**
 * mockAnswer —— 默认 Mock 回答（病害防治场景）
 * 包含完整的 RAG 结构：思考链 thoughts + 分段回答 sections + 引用来源 citations
 */
export const mockAnswer: ChatMessage = {
  id: 'm_mock_answer',
  role: 'assistant',
  content:
    '根据知识库检索结果，芒果炭疽病通常在高温高湿、通风不良和果园清洁度不足时高发。',
  thoughts: [
    '先判断问题属于病害防治场景，并锁定作物、病害名称和地区条件。',
    '再从病害防治知识库与广西果蔬栽培资料中筛选相似内容。',
    '最后把检索结果整理成可执行的田间管理建议，并保留参考来源。',
  ],
  sections: [
    {
      title: '结论',
      content: '当前问题更适合按"环境控湿 + 病残体清理 + 花果期重点巡查"的综合策略处理。',
    },
    {
      title: '操作建议',
      content: '清园修剪，摘除病果病枝；改善树冠通风透光；雨后及时排水降湿；花期、幼果期提高巡查频次。',
    },
    {
      title: '注意事项',
      content: '若病斑已经扩展，应结合当地农技部门建议选择登记药剂，避免自行混配或超量使用。',
    },
  ],
  citations: [
    {
      id: 'c1',
      title: '芒果主要病害防治技术手册.pdf',
      source: '病害防治知识库',
      score: 0.86,
      snippet: '炭疽病高发于高温高湿环境，花期和幼果期需重点防控。',
    },
    {
      id: 'c2',
      title: '广西亚热带果蔬栽培管理指南.docx',
      source: '农业技术知识库',
      score: 0.81,
      snippet: '果园通风透光和病残体清理可降低病害基数。',
    },
  ],
};

/** 政策查询场景 Mock 回答 */
const policyAnswer: ChatMessage = {
  ...mockAnswer,
  content: '根据政策库检索结果，广西果蔬种植补贴通常与规模化种植、绿色防控、设施农业和新品种示范推广相关。',
  thoughts: [
    '先识别问题属于惠农政策查询，并提取地区与产业类型。',
    '再从政策库中匹配果蔬、设施农业、绿色防控和示范基地等关键词。',
    '最后按申请条件、准备材料和注意事项整理成可执行清单。',
  ],
  sections: [
    {
      title: '结论',
      content: '建议优先关注当地农业农村部门发布的年度项目申报通知，补贴多以县区申报口径为准。',
    },
    {
      title: '操作建议',
      content: '准备种植规模证明、基地照片、土地流转或承包材料、投入记录和绿色防控记录，再联系乡镇农技站确认申报窗口。',
    },
    {
      title: '注意事项',
      content: '不同县区补贴对象、面积门槛和验收要求会有差异，提交前应核对最新通知原文。',
    },
  ],
  citations: [
    {
      id: 'c_policy_1',
      title: '广西农业产业发展项目申报指南.pdf',
      source: '惠农政策库',
      score: 0.84,
      snippet: '项目申报需结合县区年度实施方案，重点支持特色优势产业和绿色高效生产。',
    },
    {
      id: 'c_policy_2',
      title: '设施农业与绿色防控补助政策汇编.docx',
      source: '政策文件库',
      score: 0.78,
      snippet: '补助对象通常需提供生产主体信息、基地证明、投入记录和验收材料。',
    },
  ],
};

/** 花期管理场景 Mock 回答 */
const floweringAnswer: ChatMessage = {
  ...mockAnswer,
  content: '芒果花期管理的关键是控梢促花、稳花保果、病虫害预防和水肥平衡，重点避免花期湿度过高与营养失衡。',
  thoughts: [
    '先判断问题属于栽培管理，并锁定芒果花期这一生育阶段。',
    '再匹配花期控梢、授粉、病害预防和保果管理资料。',
    '最后按花前、花期、谢花后三个阶段组织建议。',
  ],
  sections: [
    {
      title: '结论',
      content: '花期管理要围绕"花稳、果稳、病害少"展开，避免单纯追肥或过度控水。',
    },
    {
      title: '操作建议',
      content: '花前控制新梢，花期保持通风透光，谢花后及时补充钙镁硼等中微量元素，并做好炭疽病和白粉病预防。',
    },
    {
      title: '注意事项',
      content: '连续阴雨时应重点降低园区湿度，减少病原积累；高温干旱时避免强刺激性叶面肥。',
    },
  ],
};

/** 荔枝花果期管理场景 Mock 回答 */
const lycheeAnswer: ChatMessage = {
  ...mockAnswer,
  content: '荔枝花果期管理需要兼顾控梢、保花、保果和水分管理，尤其要防止冲梢和异常落果。',
  thoughts: [
    '先识别作物为荔枝，并定位花果期管理需求。',
    '再检索控梢促花、保果和病虫害防控相关资料。',
    '最后按田间管理动作给出分阶段建议。',
  ],
  sections: [
    {
      title: '结论',
      content: '荔枝花果期的核心是稳定树势，避免营养生长过旺影响坐果。',
    },
    {
      title: '操作建议',
      content: '花前控梢促花，花期减少大水大肥，幼果期根据树势适度保果，并加强蒂蛀虫、霜疫霉病等监测。',
    },
    {
      title: '注意事项',
      content: '不同品种坐果习性差异明显，保果措施要结合树势和天气，不宜机械套用。',
    },
  ],
};

/** 雨季管理场景 Mock 回答 */
const rainyAnswer: ChatMessage = {
  ...mockAnswer,
  content: '雨季管理重点是排水降湿、减少病原积累、保护花果和避免药剂被雨水冲刷。',
  thoughts: [
    '先识别追问与雨季环境风险有关。',
    '再结合前文病害防治场景，优先考虑湿度、排水和药效保持。',
    '最后整理成雨前、雨中、雨后的田间操作清单。',
  ],
  sections: [
    {
      title: '结论',
      content: '雨季不是只看用药，更关键的是把园区湿度和病残体基数降下来。',
    },
    {
      title: '操作建议',
      content: '雨前疏通排水沟，雨后及时巡园剪除病枝病果；连续降雨后重点检查低洼区、密闭树冠和幼果部位。',
    },
    {
      title: '注意事项',
      content: '雨后用药应关注安全间隔期和天气窗口，避免刚喷施即遇强降雨导致药效不足。',
    },
  ],
};

/** 品种查询场景 Mock 回答 */
const varietyAnswer: ChatMessage = {
  ...mockAnswer,
  content: '亚热带果蔬常见品类包括芒果、荔枝、龙眼、香蕉、火龙果、柑橘、百香果、番木瓜、菠萝和部分特色瓜菜。',
  thoughts: [
    '先识别问题属于品种查询，重点关注亚热带生态区和华南生产场景。',
    '再按水果、蔬菜和特色经济作物进行归类。',
    '最后补充适宜区域与选择品种时需要注意的生产条件。',
  ],
  sections: [
    {
      title: '主要水果',
      content: '芒果、荔枝、龙眼、香蕉、火龙果、柑橘、百香果、菠萝、番木瓜等是华南亚热带地区常见品类。',
    },
    {
      title: '特色蔬菜',
      content: '可关注苦瓜、丝瓜、辣椒、番茄、茄子、菜心、豇豆等适合温暖湿润环境的品类。',
    },
    {
      title: '选择建议',
      content: '品种选择要结合温度、降雨、土壤、市场渠道和病虫害压力，优先选择当地已有成熟栽培经验的品种。',
    },
  ],
};

/** 市场洞察场景 Mock 回答 */
const marketAnswer: ChatMessage = {
  ...mockAnswer,
  content: '当前广西及华南果蔬市场的关键机会，集中在高端礼盒果、设施化稳定供给和品牌化冷链渠道。',
  thoughts: [
    '先识别问题属于市场洞察类需求，重点看供需、渠道和价格波动。',
    '再结合节令、消费偏好和产区供给节奏组织回答。',
    '最后把机会点落到可执行的市场动作上。',
  ],
  sections: [
    {
      title: '结论',
      content: '高附加值品类更适合做品牌和渠道优化，标准化分级包装比单纯扩面积更有效。',
    },
    {
      title: '操作建议',
      content: '关注节假日礼盒、商超直供和直播电商三类渠道，同时建立分级定价和冷链周转机制。',
    },
    {
      title: '注意事项',
      content: '市场判断要结合单品供给峰值和同类竞品进入时间，避免在集中上市期盲目放量。',
    },
  ],
};

/** 行业趋势场景 Mock 回答 */
const trendAnswer: ChatMessage = {
  ...mockAnswer,
  content: '未来一段时间，果蔬产业会继续向标准化生产、智慧农业、低碳种植和数据驱动决策演进。',
  thoughts: [
    '先识别问题属于行业趋势类需求，重点看技术、政策和产业组织方式。',
    '再从智慧农业、设施化、品牌化和绿色低碳几个方向归纳。',
    '最后给出适合平台用户的趋势判断。',
  ],
  sections: [
    {
      title: '结论',
      content: '行业竞争正在从单纯种植能力转向"数据 + 供应链 + 品牌"综合能力。',
    },
    {
      title: '操作建议',
      content: '优先建设可追溯数据链路、产销协同分析和病虫害预警能力，让业务从经验驱动转向数据驱动。',
    },
    {
      title: '注意事项',
      content: '趋势判断不要只看技术热点，必须结合当地作物结构、经营主体规模和渠道成熟度。',
    },
  ],
};

/** 头脑风暴场景 Mock 回答 */
const brainstormAnswer: ChatMessage = {
  ...mockAnswer,
  content: '可以从示范基地、专家协同、知识库联动和农户陪伴四个方向继续延展当前工作台。',
  thoughts: [
    '先把问题当作创意探索，目标是输出可落地的业务方向。',
    '再围绕农业AI平台的资源、知识和服务能力展开。',
    '最后整理成几个可执行的产品/运营方案。',
  ],
  sections: [
    {
      title: '结论',
      content: '最有效的方向是把问答、知识库、预警和专家服务串成一条完整闭环。',
    },
    {
      title: '操作建议',
      content: '可增加"问题自动归类""高风险预警推送""专家一键接单""农户任务清单"四类能力。',
    },
    {
      title: '注意事项',
      content: '任何创意方案都要先判断是否能被用户在 3 秒内看懂、在 30 秒内完成一次操作。',
    },
  ],
};

/** 数据安全场景 Mock 回答 */
const securityAnswer: ChatMessage = {
  ...mockAnswer,
  content: '数据安全的重点是权限分级、操作留痕、敏感字段脱敏和导出控制。',
  thoughts: [
    '先识别问题属于数据安全与合规。',
    '再从权限、审计、脱敏和导出四个维度组织建议。',
    '最后补充平台型系统常见的安全控制动作。',
  ],
  sections: [
    {
      title: '结论',
      content: '农业研究平台的数据安全，应优先防止越权访问、批量导出和敏感信息泄露。',
    },
    {
      title: '操作建议',
      content: '对专家、管理员、普通用户设置不同权限，关键操作保留日志，导出前增加审批或水印。',
    },
    {
      title: '注意事项',
      content: '如果接入真实生产数据，还需要同步考虑数据分级分类、备份恢复和接口鉴权。',
    },
  ],
};

/**
 * createMockAnswer —— 根据用户提问内容匹配对应的 Mock 回答
 * @param question - 用户输入的问题文本
 * @returns 匹配到的 ChatMessage，未命中任何关键词时返回默认病害防治回答
 *
 * 匹配规则（按优先级从高到低）：
 *   市场洞察 > 行业趋势 > 头脑风暴 > 数据安全 > 政策查询 > 品种查询 > 荔枝 > 花期管理 > 雨季管理 > 默认病害
 */
export function createMockAnswer(question: string): ChatMessage {
  if (/市场洞察|市场|消费|渠道/.test(question)) return marketAnswer;
  if (/行业趋势|趋势|未来|发展/.test(question)) return trendAnswer;
  if (/头脑风暴|创意|方案|灵感/.test(question)) return brainstormAnswer;
  if (/数据安全|安全|脱敏|权限/.test(question)) return securityAnswer;
  if (/政策|补贴|申报/.test(question)) return policyAnswer;
  if (/品种|有哪些|果蔬/.test(question)) return varietyAnswer;
  if (/荔枝|龙眼/.test(question)) return lycheeAnswer;
  if (/花期|保花|保果|控梢/.test(question)) return floweringAnswer;
  if (/雨季|下雨|降雨|排水/.test(question)) return rainyAnswer;
  return mockAnswer; // 默认返回病害防治回答
}
