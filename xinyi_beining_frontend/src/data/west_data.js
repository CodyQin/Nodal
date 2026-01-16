const WEST_DATA = {
    "total_characters": 10,
    "nodes": [
        // ===== 第 1 章 =====
        {
            "id": "wangmiao",
            "label": "汪淼",
            "chapter": 1,
            "description": "纳米材料科学家，被迫卷入三体危机，通过玩《三体》游戏逐渐揭开真相。",
            "centrality": 3,
            "visual": { "size": 34 }
        },
        {
            "id": "shi_qiang",
            "label": "史强",
            "chapter": 1,
            "description": "行事粗鲁但观察敏锐的警察，负责保护科学家，是这次行动的实际执行者。",
            "centrality": 2,
            "visual": { "size": 30 }
        },

        // ===== 第 2 章 =====
        {
            "id": "ye_wenjie",
            "label": "叶文洁",
            "chapter": 2,
            "description": "天体物理学家，地球三体组织的精神领袖，亲手按下了毁灭人类的按钮。",
            "centrality": 3,
            "visual": { "size": 38 }
        },
        {
            "id": "hong_an_base",
            "label": "红岸基地",
            "chapter": 2,
            "description": "冷战时期的绝密工程基地，人类第一次向宇宙发出高功率信号的地方。",
            "centrality": 1,
            "visual": { "size": 28 }
        },

        // ===== 第 3 章 =====
        {
            "id": "trisolaran",
            "label": "三体文明",
            "chapter": 3,
            "description": "距离地球4光年的外星文明，因母星环境恶劣，意图侵占地球。",
            "centrality": 3,
            "visual": { "size": 42 }
        },

        // ===== 第 4 章 =====
        {
            "id": "eto",
            "label": "地球三体组织",
            "chapter": 4,
            "description": "由希望借助外星力量改造人类社会的精英组成的秘密组织。",
            "centrality": 2,
            "visual": { "size": 36 }
        },

        // ===== 第 5 章 =====
        {
            "id": "three_body_game",
            "label": "三体游戏",
            "chapter": 5,
            "description": "ETO 开发的虚拟现实游戏，用于在知识阶层中筛选三体文明的同情者。",
            "centrality": 2,
            "visual": { "size": 30 }
        },

        // ===== 第 6 章 =====
        {
            "id": "pan_han",
            "label": "潘寒",
            "chapter": 6,
            "description": "著名的环保主义者，ETO 降临派的核心骨干，负责诛杀异己。",
            "centrality": 1,
            "visual": { "size": 32 }
        },

        // ===== 第 7 章 =====
        {
            "id": "sophon",
            "label": "智子",
            "chapter": 7,
            "description": "三体人制造的微观粒子超级计算机，用于封锁人类基础科学。",
            "centrality": 3,
            "visual": { "size": 40 }
        },

        // ===== 第 8 章 =====
        {
            "id": "gu_zheng",
            "label": "古筝行动",
            "chapter": 8,
            "description": "史强提出的作战计划，利用纳米飞刃在巴拿马运河切割“审判日号”。",
            "centrality": 2,
            "visual": { "size": 34 }
        }
    ],
    "edges": [
        // ===== 第 1 章 =====
        {
            "id": "e1",
            "source": "wangmiao",
            "target": "shi_qiang",
            "chapter": 1,
            "relation": {
                "type": "ally",
                "label": "调查合作",
                "description": "史强负责保护汪淼安全，汪淼作为卧底进入ETO内部。"
            },
            "visual": { "color": "#f4ff1d", "weight": 0.6 }
        },

        // ===== 第 2 章 =====
        {
            "id": "e2",
            "source": "ye_wenjie",
            "target": "hong_an_base",
            "chapter": 2,
            "relation": {
                "type": "location",
                "label": "核心成员",
                "description": "叶文洁在文革期间被调入红岸基地，担任核心技术岗位。"
            },
            "visual": { "color": "#f4ff1d", "weight": 0.5 }
        },
        {
            "id": "e3",
            "source": "wangmiao",
            "target": "ye_wenjie",
            "chapter": 2,
            "relation": {
                "type": "investigate",
                "label": "接触 / 怀疑",
                "description": "汪淼借着了解杨冬死因的机会接近叶文洁，逐渐发现端倪。"
            },
            "visual": { "color": "#f4ff1d", "weight": 0.5 }
        },

        // ===== 第 3 章 =====
        {
            "id": "e4",
            "source": "ye_wenjie",
            "target": "trisolaran",
            "chapter": 3,
            "relation": {
                "type": "contact",
                "label": "首次回应",
                "description": "叶文洁私自回复了三体世界的警告，邀请其降临地球。"
            },
            "visual": { "color": "#ff8c00", "weight": 0.8 }
        },

        // ===== 第 4 章 =====
        {
            "id": "e5",
            "source": "trisolaran",
            "target": "eto",
            "chapter": 4,
            "relation": {
                "type": "control",
                "label": "信仰 / 控制",
                "description": "三体文明是 ETO 的“主”，ETO 则是其在地球的第五纵队。"
            },
            "visual": { "color": "#ff5c5c", "weight": 0.9 }
        },

        // ===== 第 5 章 =====
        {
            "id": "e6",
            "source": "eto",
            "target": "three_body_game",
            "chapter": 5,
            "relation": {
                "type": "tool",
                "label": "招募工具",
                "description": "利用游戏筛选思想上认同三体价值观的人类精英。"
            },
            "visual": { "color": "#f4ff1d", "weight": 0.6 }
        },

        // ===== 第 6 章 =====
        {
            "id": "e7",
            "source": "pan_han",
            "target": "eto",
            "chapter": 6,
            "relation": {
                "type": "member",
                "label": "核心骨干",
                "description": "潘寒是降临派的激进分子，负责具体行动和清洗。"
            },
            "visual": { "color": "#ff5c5c", "weight": 0.7 }
        },

        // ===== 第 7 章 =====
        {
            "id": "e8",
            "source": "trisolaran",
            "target": "sophon",
            "chapter": 7,
            "relation": {
                "type": "deploy",
                "label": "派遣",
                "description": "三体人将质子二维展开蚀刻电路，制造出智子并发往地球。"
            },
            "visual": { "color": "#ff0000", "weight": 1.0 }
        },
        {
            "id": "e9",
            "source": "sophon",
            "target": "wangmiao",
            "chapter": 7,
            "relation": {
                "type": "harass",
                "label": "监控 / 干扰",
                "description": "智子在汪淼视网膜上投射倒计时，试图逼疯科学家。"
            },
            "visual": { "color": "#ff0000", "weight": 0.9 }
        },

        // ===== 第 8 章 =====
        {
            "id": "e10",
            "source": "shi_qiang",
            "target": "gu_zheng",
            "chapter": 8,
            "relation": {
                "type": "action",
                "label": "执行行动",
                "description": "史强想出了用“飞刃”切割船体的疯狂计划。"
            },
            "visual": { "color": "#00eaff", "weight": 0.8 }
        },
        {
            "id": "e11",
            "source": "eto",
            "target": "gu_zheng",
            "chapter": 8,
            "relation": {
                "type": "victim",
                "label": "遭受打击",
                "description": "ETO 的总部“审判日号”在古筝行动中被彻底摧毁。"
            },
            "visual": { "color": "#00eaff", "weight": 0.8 }
        }
    ]
};

export default WEST_DATA;