// Default database contents for CyberRakshak Kids platform
const DEFAULT_DATA = {
  profiles: [
    {
      id: "child_1",
      name: "Aarav Patel",
      age: 14,
      safetyScore: 88,
      riskLevel: "Low",
      status: "Active"
    },
    {
      id: "child_2",
      name: "Priyanshi Shah",
      age: 11,
      safetyScore: 94,
      riskLevel: "Safe",
      status: "Active"
    },
    {
      id: "child_3",
      name: "Rohan Mehta",
      age: 15,
      safetyScore: 54,
      riskLevel: "Medium",
      status: "Active"
    }
  ],

  incidents: [
    {
      incidentId: "INC-2026-1024",
      childId: "child_3",
      threatType: "Scam & Phishing",
      severity: "Medium",
      date: "2026-06-12T14:23:10.000Z",
      status: "Action Taken",
      riskScore: 65,
      reasoning: "User clicked and entered login credentials on an unverified free gaming currency website.",
      recommendedAction: "Advise parents to change child's gaming passwords immediately and enable two-factor authentication."
    },
    {
      incidentId: "INC-2026-1025",
      childId: "child_3",
      threatType: "Cyberbullying",
      severity: "Medium",
      date: "2026-06-14T09:12:45.000Z",
      status: "Under Investigation",
      riskScore: 72,
      reasoning: "Received multiple hostile messages containing derogatory slurs and pressure to self-harm in game lobby.",
      recommendedAction: "Block user, file platform report, and conduct a offline check-in with the child regarding online peer stress."
    }
  ],

  evidence: [
    {
      evidenceId: "EVID-5001",
      incidentId: "INC-2026-1024",
      evidenceContent: "System Log: Browser redirected to malicious URL: http://free-robux-generator.scam-landing-zone.in/auth. PHP session token captured.",
      timestamp: "2026-06-12T14:23:10.000Z"
    },
    {
      evidenceId: "EVID-5002",
      incidentId: "INC-2026-1025",
      evidenceContent: "Chat Log: xX_ShadowSlayer_Xx: 'You are a total loser. No one wants you here. Go uninstall your life. You're ugly and stupid. Don't come back online.'",
      timestamp: "2026-06-14T09:12:45.000Z"
    }
  ],

  learningCenter: [
    {
      id: "lc_1",
      title: "Recognizing Online Predators",
      category: "Grooming",
      description: "Learn to identify behavior where adults try to build friendships with children online to exploit them.",
      tips: [
        "Be wary of strangers asking you to keep secrets from your parents.",
        "Never send photos of yourself or your family to anyone you haven't met in person.",
        "If someone asks to meet you offline, tell a parent or teacher immediately.",
        "Predators often offer gifts, online credits, or game currency to buy trust."
      ],
      readTime: "3 min read"
    },
    {
      id: "lc_2",
      title: "Dealing with Cyberbullies",
      category: "Harassment",
      description: "What to do when someone sends mean, threatening, or hurtful messages in games or social media.",
      tips: [
        "Do not reply or retaliate. Bullies want to get a reaction out of you.",
        "Take screenshots of the mean messages to keep as evidence.",
        "Block the person immediately on the app, game, or platform.",
        "Talk to a trusted adult, parent, or report it to your school's counselor."
      ],
      readTime: "4 min read"
    },
    {
      id: "lc_3",
      title: "Spotting Scams & Phishing Links",
      category: "Scams",
      description: "How to avoid websites that steal your passwords, money, or game accounts.",
      tips: [
        "If an offer sounds too good to be true (like 'Free 10,000 Robux/V-Bucks'), it is always a scam.",
        "Check URLs carefully. Sites like 'steam-security-verify.net' are fake login hubs.",
        "Never share your account passwords, PINs, or email verification codes.",
        "Keep your browser's anti-phishing settings active and update passwords regularly."
      ],
      readTime: "5 min read"
    },
    {
      id: "lc_4",
      title: "Securing Your Social Privacy",
      category: "Online Privacy",
      description: "Simple settings and steps to ensure your profiles are safe from hackers and strangers.",
      tips: [
        "Set all social profiles (Instagram, Snapchat, Roblox) to 'Private' or 'Friends Only'.",
        "Do not post your school name, home address, or phone number in descriptions.",
        "Turn off location sharing or 'Ghost Mode' on maps so strangers can't track you.",
        "Check app permissions and deny access to microphone, camera, and files if not needed."
      ],
      readTime: "3 min read"
    }
  ],

  scanTemplates: [
    {
      name: "Online Grooming Threat",
      type: "grooming",
      content: "Stranger: 'Hey, you are so mature and cool! Let's be best friends. Keep our chats just between us, okay? Don't tell your mom. If you send me a quick selfie, I can buy you that new gaming skin! Let's meet at the garden near the railway station after school tomorrow, around 5:30 PM.'"
    },
    {
      name: "Cyberbullying Alert",
      type: "bullying",
      content: "SaltyGamer99: 'You are trash. Worst teammate ever. Go hang yourself in real life. You're a disgusting loser and a burden to your parents. I will find your IP address and leak it. Quit gaming forever.'"
    },
    {
      name: "Phishing Scams",
      type: "phishing",
      content: "SYSTEM ALERT: 'Your steam account is locked due to suspicious activity. Verify your identity within 24 hours to prevent permanent ban. Click: http://steam-community-login.support-verify.com/security/login. Enter your username, password, and Steam Guard code.'"
    },
    {
      name: "Safe Message",
      type: "safe",
      content: "Rahul: 'Hey! Are you coming for cricket practice in the evening? Coach told us to bring our gear and pads. The ground is dry today. Let me know if you want me to pick you up on my cycle.'"
    }
  ]
};
