import type { PlayableTemplate } from '@/types/templates'

export const predefinedTemplates: PlayableTemplate[] = [
  {
    id: 'three-spins-endcard',
    name: 'Triple Spin Showcase',
    description: 'Three engaging spins followed by an attractive end card with bonus offer',
    category: 'engagement',
    thumbnail: '/templates/three-spins.png',
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
    tags: ['beginner-friendly', 'quick-play', 'high-conversion'],
    popularity: 95
  },
  {
    id: 'big-win-celebration',
    name: 'Big Win Experience',
    description: 'Build excitement with guaranteed big win on third spin',
    category: 'conversion',
    thumbnail: '/templates/big-win.png',
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
    tags: ['exciting', 'guaranteed-win', 'high-energy'],
    popularity: 88
  },
  {
    id: 'free-spins-teaser',
    name: 'Free Spins Teaser',
    description: 'Show the excitement of triggering free spins feature',
    category: 'bonus',
    thumbnail: '/templates/free-spins.png',
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
        count: 25,
        patterns: []
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
          id: 'free-spins',
          type: 'free-spins',
          name: 'Free Spins',
          trigger: {
            type: 'scatter',
            count: 3
          },
          config: {
            spins: 10,
            multiplier: 3,
            retrigger: true
          }
        }
      ]
    },
    tags: ['bonus-focused', 'feature-rich', 'engaging'],
    popularity: 92
  },
  {
    id: 'progressive-jackpot',
    name: 'Jackpot Chase',
    description: 'Build anticipation with progressive jackpot meters',
    category: 'retention',
    thumbnail: '/templates/jackpot.png',
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
    tags: ['jackpot', 'high-stakes', 'long-term-engagement'],
    popularity: 85
  },
  {
    id: 'time-pressure',
    name: 'Limited Time Rush',
    description: 'Create urgency with countdown timer and rapid spins',
    category: 'engagement',
    thumbnail: '/templates/time-rush.png',
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
        count: 5,
        patterns: []
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
    tags: ['fast-paced', 'urgency', 'mobile-optimized'],
    popularity: 78
  },
  {
    id: 'loss-recovery',
    name: 'Second Chance Win',
    description: 'Turn losses into wins with special recovery bonus',
    category: 'retention',
    thumbnail: '/templates/loss-recovery.png',
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
        count: 15,
        patterns: []
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