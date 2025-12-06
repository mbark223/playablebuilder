import type { PlayableTemplate } from '@/types/templates'

const escapeSvgText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const createTemplateThumbnail = (title: string, accent: string, background: string) => {
  const safeTitle = escapeSvgText(title)
  const svg = `
<svg width="400" height="240" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${background}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.95" />
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${background}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="400" height="240" rx="32" fill="url(#grad)" />
  <circle cx="320" cy="40" r="120" fill="url(#glow)" />
  <rect x="24" y="24" width="80" height="32" rx="8" fill="rgba(15,23,42,0.45)" />
  <text x="32" y="47" fill="white" font-family="Inter, sans-serif" font-size="12" font-weight="600" letter-spacing="1.5">
    PLAYABLE
  </text>
  <text x="32" y="120" fill="white" font-family="Inter, sans-serif" font-size="28" font-weight="600">
    ${safeTitle}
  </text>
  <text x="32" y="160" fill="rgba(255,255,255,0.85)" font-family="Inter, sans-serif" font-size="16">
    Ready-to-use variation
  </text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const predefinedTemplates: PlayableTemplate[] = [
  {
    id: 'three-spins-endcard',
    name: 'Triple Spin Showcase',
    description: 'Three engaging spins followed by an attractive end card with bonus offer',
    category: 'engagement',
    thumbnail: createTemplateThumbnail('Triple Spin Showcase', '#f97316', '#0f172a'),
    scenario: {
      type: 'spin-count',
      steps: [
        {
          id: 'spin1',
          type: 'spin',
          action: 'auto-spin',
          duration: 2000,
          nextStep: 'wait1'
        },
        {
          id: 'wait1',
          type: 'wait',
          action: 'pause',
          duration: 1000,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'auto-spin',
          duration: 2000,
          nextStep: 'wait2'
        },
        {
          id: 'wait2',
          type: 'wait',
          action: 'pause',
          duration: 1000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'auto-spin',
          duration: 2000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-endcard',
          duration: 0
        }
      ],
      offer: {
        type: 'fullscreen',
        content: {
          headline: 'Amazing Wins Await!',
          subheadline: 'Get 100 Free Spins + $1000 Bonus',
          cta: {
            text: 'Play Now',
            style: 'pulse'
          },
          bonus: {
            amount: '100 Free Spins',
            currency: 'spins'
          }
        },
        timing: {
          delay: 500,
          autoShow: true,
          dismissible: false
        },
        animation: 'zoom'
      }
    },
    defaultConfig: {
      reels: {
        layout: '6x4',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5']
          ]
        },
        spinSpeed: 1000,
        stopDelay: [0, 100, 200, 300, 400],
        bounceAnimation: true,
        blurEffect: true,
        anticipationStop: false
      },
      paylines: {
        type: 'fixed',
        fixedLines: [],
        displayStyle: 'onWin',
        animation: 'glow'
      },
      math: {
        rtp: 96.5,
        volatility: 'medium',
        hitFrequency: 25,
        maxWin: 5000,
        baseGameWeight: 70,
        featureWeight: 30,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: []
    },
    visuals: {
      background: '#0f172a',
      accent: '#f97316',
      secondary: '#fb923c',
      headline: 'Three spins to unlock mega rewards',
      body: 'Showcase guaranteed excitement as players experience back-to-back spins.',
      cta: 'Claim Free Spins',
      ctaColor: '#0f172a',
      slotBackground: '#020617',
      slotAccent: '#f97316',
      slotOverlayText: 'Triple Spin Showcase'
    },
    tags: ['beginner-friendly', 'quick-play', 'high-conversion'],
    popularity: 95
  },
  {
    id: 'big-win-celebration',
    name: 'Big Win Experience',
    description: 'Build excitement with guaranteed big win on third spin',
    category: 'conversion',
    thumbnail: createTemplateThumbnail('Big Win Experience', '#22d3ee', '#111827'),
    scenario: {
      type: 'win-triggered',
      steps: [
        {
          id: 'spin1',
          type: 'spin',
          action: 'auto-spin-small-win',
          duration: 2000,
          nextStep: 'celebrate1'
        },
        {
          id: 'celebrate1',
          type: 'animate',
          action: 'small-win-animation',
          duration: 1500,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'auto-spin-medium-win',
          duration: 2000,
          nextStep: 'celebrate2'
        },
        {
          id: 'celebrate2',
          type: 'animate',
          action: 'medium-win-animation',
          duration: 2000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'auto-spin-mega-win',
          duration: 2500,
          nextStep: 'mega-celebrate'
        },
        {
          id: 'mega-celebrate',
          type: 'animate',
          action: 'mega-win-celebration',
          duration: 3000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-offer',
          duration: 0
        }
      ],
      offer: {
        type: 'modal',
        content: {
          headline: 'Keep the Wins Coming!',
          subheadline: 'Join now and get 250% match bonus',
          cta: {
            text: 'Claim Your Bonus',
            style: 'gradient'
          },
          bonus: {
            amount: '$500',
            currency: 'cash'
          }
        },
        timing: {
          delay: 1000,
          autoShow: true,
          dismissible: false
        },
        animation: 'bounce'
      }
    },
    defaultConfig: {
      reels: {
        layout: '5x4',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5']
          ]
        },
        spinSpeed: 1200,
        stopDelay: [0, 150, 300, 450, 600],
        bounceAnimation: true,
        blurEffect: true,
        anticipationStop: true
      },
      paylines: {
        type: 'ways',
        waysCount: 243,
        displayStyle: 'onWin',
        animation: 'trace'
      },
      math: {
        rtp: 97.2,
        volatility: 'high',
        hitFrequency: 30,
        maxWin: 10000,
        baseGameWeight: 65,
        featureWeight: 35,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: []
    },
    visuals: {
      background: '#111827',
      accent: '#22d3ee',
      secondary: '#0ea5e9',
      headline: 'Deliver a cinematic big win sequence',
      body: 'Guide players through escalating wins ending with a celebration modal.',
      cta: 'Continue Winning',
      ctaColor: '#0c4a6e',
      slotBackground: '#020617',
      slotAccent: '#22d3ee',
      slotOverlayText: 'Big Win Experience'
    },
    tags: ['exciting', 'guaranteed-win', 'high-energy'],
    popularity: 88
  },
  {
    id: 'free-spins-teaser',
    name: 'Free Spins Teaser',
    description: 'Show the excitement of triggering free spins feature',
    category: 'bonus',
    thumbnail: createTemplateThumbnail('Free Spins Teaser', '#a855f7', '#09090b'),
    scenario: {
      type: 'spin-count',
      steps: [
        {
          id: 'spin1',
          type: 'spin',
          action: 'auto-spin',
          duration: 2000,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'auto-spin-scatter-tease',
          duration: 2000,
          nextStep: 'tease'
        },
        {
          id: 'tease',
          type: 'animate',
          action: 'scatter-near-miss',
          duration: 1000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'auto-spin-trigger-bonus',
          duration: 2500,
          nextStep: 'bonus-triggered'
        },
        {
          id: 'bonus-triggered',
          type: 'animate',
          action: 'free-spins-trigger',
          duration: 3000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-offer',
          duration: 0
        }
      ],
      offer: {
        type: 'integrated',
        content: {
          headline: 'Unlock Unlimited Free Spins!',
          subheadline: 'Sign up to continue playing',
          cta: {
            text: 'Start Free Spins',
            style: 'pulse'
          }
        },
        timing: {
          autoShow: true,
          dismissible: false
        },
        animation: 'slide-up'
      }
    },
    defaultConfig: {
      reels: {
        layout: '5x3',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5']
          ]
        },
        spinSpeed: 1000,
        stopDelay: [0, 100, 200, 300, 400],
        bounceAnimation: true,
        blurEffect: true,
        anticipationStop: false
      },
      paylines: {
        type: 'fixed',
        fixedLines: [],
        displayStyle: 'onWin',
        animation: 'glow'
      },
      math: {
        rtp: 96.8,
        volatility: 'medium',
        hitFrequency: 22,
        maxWin: 7500,
        baseGameWeight: 60,
        featureWeight: 40,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: [
        {
          type: 'scatter',
          requirement: {
            scatterCount: 3
          },
          feature: 'freeSpins',
          guarantee: false
        }
      ]
    },
    visuals: {
      background: '#09090b',
      accent: '#a855f7',
      secondary: '#f472b6',
      headline: 'Tease the thrill of triggering free spins',
      body: 'Use suspenseful scatters and bursts of color to push towards signup.',
      cta: 'Start Free Spins',
      ctaColor: '#fdf2f8',
      slotBackground: '#150623',
      slotAccent: '#e879f9',
      slotOverlayText: 'Free Spins Teaser'
    },
    tags: ['bonus-focused', 'feature-rich', 'engaging'],
    popularity: 92
  },
  {
    id: 'progressive-jackpot',
    name: 'Jackpot Chase',
    description: 'Build anticipation with progressive jackpot meters',
    category: 'retention',
    thumbnail: createTemplateThumbnail('Jackpot Chase', '#facc15', '#0b1120'),
    scenario: {
      type: 'progressive',
      steps: [
        {
          id: 'intro',
          type: 'animate',
          action: 'show-jackpot-meters',
          duration: 2000,
          nextStep: 'spin1'
        },
        {
          id: 'spin1',
          type: 'spin',
          action: 'auto-spin-collect',
          duration: 2000,
          nextStep: 'collect1'
        },
        {
          id: 'collect1',
          type: 'animate',
          action: 'jackpot-progress',
          duration: 1000,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'auto-spin-collect',
          duration: 2000,
          nextStep: 'collect2'
        },
        {
          id: 'collect2',
          type: 'animate',
          action: 'jackpot-progress',
          duration: 1000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'auto-spin-jackpot-tease',
          duration: 2500,
          nextStep: 'near-jackpot'
        },
        {
          id: 'near-jackpot',
          type: 'animate',
          action: 'near-jackpot-animation',
          duration: 2000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-offer',
          duration: 0
        }
      ],
      offer: {
        type: 'fullscreen',
        content: {
          headline: 'You\'re So Close to the Jackpot!',
          subheadline: 'Join now to win $50,000 Grand Jackpot',
          image: '/assets/jackpot-visual.png',
          cta: {
            text: 'Chase the Jackpot',
            style: 'gradient'
          }
        },
        timing: {
          delay: 0,
          autoShow: true,
          dismissible: false
        },
        animation: 'rotate'
      }
    },
    defaultConfig: {
      reels: {
        layout: '5x4',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3', 'symbol4'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4']
          ]
        },
        spinSpeed: 1000,
        stopDelay: [0, 100, 200, 300, 400],
        bounceAnimation: true,
        blurEffect: true,
        anticipationStop: false
      },
      paylines: {
        type: 'ways',
        waysCount: 1024,
        displayStyle: 'onWin',
        animation: 'pulse'
      },
      math: {
        rtp: 95.5,
        volatility: 'very-high',
        hitFrequency: 20,
        maxWin: 50000,
        baseGameWeight: 50,
        featureWeight: 50,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: []
    },
    visuals: {
      background: '#0b1120',
      accent: '#facc15',
      secondary: '#f87171',
      headline: 'Drive urgency with a climbing jackpot meter',
      body: 'Use progress meters and near-miss effects to promote retention loops.',
      cta: 'Chase the Jackpot',
      ctaColor: '#111827',
      slotBackground: '#030712',
      slotAccent: '#facc15',
      slotOverlayText: 'Jackpot Chase'
    },
    tags: ['jackpot', 'high-stakes', 'long-term-engagement'],
    popularity: 85
  },
  {
    id: 'time-pressure',
    name: 'Limited Time Rush',
    description: 'Create urgency with countdown timer and rapid spins',
    category: 'engagement',
    thumbnail: createTemplateThumbnail('Limited Time Rush', '#fb7185', '#0c0a09'),
    scenario: {
      type: 'time-based',
      steps: [
        {
          id: 'countdown-start',
          type: 'animate',
          action: 'start-countdown',
          duration: 1000,
          nextStep: 'spin1'
        },
        {
          id: 'spin1',
          type: 'spin',
          action: 'turbo-spin',
          duration: 1000,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'turbo-spin',
          duration: 1000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'turbo-spin',
          duration: 1000,
          nextStep: 'spin4'
        },
        {
          id: 'spin4',
          type: 'spin',
          action: 'turbo-spin-big-win',
          duration: 1200,
          nextStep: 'time-up'
        },
        {
          id: 'time-up',
          type: 'animate',
          action: 'countdown-end',
          duration: 1000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-offer',
          duration: 0
        }
      ],
      offer: {
        type: 'banner',
        content: {
          headline: 'Time\'s Up! Don\'t Miss Out',
          subheadline: 'Claim 50 Turbo Spins NOW',
          cta: {
            text: 'Grab Offer',
            style: 'primary'
          },
          bonus: {
            amount: '50 Turbo Spins',
            currency: 'spins'
          }
        },
        timing: {
          autoShow: true,
          dismissible: false
        },
        animation: 'slide-up'
      }
    },
    defaultConfig: {
      reels: {
        layout: '3x3',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3'],
            ['symbol1', 'symbol2', 'symbol3'],
            ['symbol1', 'symbol2', 'symbol3']
          ]
        },
        spinSpeed: 800,
        stopDelay: [0, 50, 100],
        bounceAnimation: false,
        blurEffect: true,
        anticipationStop: false
      },
      paylines: {
        type: 'fixed',
        fixedLines: [],
        displayStyle: 'onWin',
        animation: 'trace'
      },
      math: {
        rtp: 97.0,
        volatility: 'low',
        hitFrequency: 35,
        maxWin: 1000,
        baseGameWeight: 80,
        featureWeight: 20,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: []
    },
    visuals: {
      background: '#0c0a09',
      accent: '#fb7185',
      secondary: '#fcd34d',
      headline: 'Use countdown urgency to boost conversions',
      body: 'Turbo spins plus a timer bar keep attention locked on the CTA.',
      cta: 'Grab Turbo Spins',
      ctaColor: '#111827',
      slotBackground: '#1b0308',
      slotAccent: '#fb7185',
      slotOverlayText: 'Limited Time Rush'
    },
    tags: ['fast-paced', 'urgency', 'mobile-optimized'],
    popularity: 78
  },
  {
    id: 'loss-recovery',
    name: 'Second Chance Win',
    description: 'Turn losses into wins with special recovery bonus',
    category: 'retention',
    thumbnail: createTemplateThumbnail('Second Chance Win', '#38bdf8', '#0b1220'),
    scenario: {
      type: 'loss-streak',
      steps: [
        {
          id: 'spin1',
          type: 'spin',
          action: 'auto-spin-loss',
          duration: 2000,
          nextStep: 'loss1'
        },
        {
          id: 'loss1',
          type: 'show-message',
          action: 'show-loss-message',
          duration: 1000,
          nextStep: 'spin2'
        },
        {
          id: 'spin2',
          type: 'spin',
          action: 'auto-spin-loss',
          duration: 2000,
          nextStep: 'loss2'
        },
        {
          id: 'loss2',
          type: 'show-message',
          action: 'show-close-message',
          duration: 1000,
          nextStep: 'spin3'
        },
        {
          id: 'spin3',
          type: 'spin',
          action: 'auto-spin-recovery-win',
          duration: 2500,
          nextStep: 'recovery'
        },
        {
          id: 'recovery',
          type: 'animate',
          action: 'recovery-celebration',
          duration: 2000,
          nextStep: 'show-offer'
        },
        {
          id: 'show-offer',
          type: 'show-message',
          action: 'display-offer',
          duration: 0
        }
      ],
      offer: {
        type: 'modal',
        content: {
          headline: 'Never Lose Again!',
          subheadline: 'Get Loss Protection + Cashback',
          cta: {
            text: 'Activate Protection',
            style: 'secondary'
          },
          bonus: {
            amount: '25% Cashback',
            currency: 'cash'
          }
        },
        timing: {
          delay: 500,
          autoShow: true,
          dismissible: true
        },
        animation: 'fade-in'
      }
    },
    defaultConfig: {
      reels: {
        layout: '5x3',
        reelSets: {
          normal: [
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5'],
            ['symbol1', 'symbol2', 'symbol3', 'symbol4', 'symbol5']
          ]
        },
        spinSpeed: 1000,
        stopDelay: [0, 100, 200, 300, 400],
        bounceAnimation: true,
        blurEffect: true,
        anticipationStop: false
      },
      paylines: {
        type: 'fixed',
        fixedLines: [],
        displayStyle: 'onWin',
        animation: 'pulse'
      },
      math: {
        rtp: 96.0,
        volatility: 'medium',
        hitFrequency: 28,
        maxWin: 3000,
        baseGameWeight: 75,
        featureWeight: 25,
        demonstrationMode: {
          guaranteedBigWin: true,
          triggerTiming: 10,
          winAmount: 'mega'
        }
      },
      features: []
    },
    visuals: {
      background: '#0b1220',
      accent: '#38bdf8',
      secondary: '#fbbf24',
      headline: 'Turn losing streaks into comeback moments',
      body: 'Show a guided recovery path ending with a relief-focused CTA.',
      cta: 'Activate Protection',
      ctaColor: '#0f172a',
      slotBackground: '#08111f',
      slotAccent: '#38bdf8',
      slotOverlayText: 'Second Chance Win'
    },
    tags: ['player-friendly', 'emotional', 'recovery-focused'],
    popularity: 72
  }
]

export function getTemplateById(id: string): PlayableTemplate | undefined {
  return predefinedTemplates.find(template => template.id === id)
}

export function getTemplatesByCategory(category: PlayableTemplate['category']): PlayableTemplate[] {
  return predefinedTemplates.filter(template => template.category === category)
}

export function getPopularTemplates(limit: number = 3): PlayableTemplate[] {
  return [...predefinedTemplates]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}
