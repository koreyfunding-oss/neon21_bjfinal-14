import { motion } from 'framer-motion';
import { Crown, Zap, Flame, Star, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';
import { useNavigate } from 'react-router-dom';

const WHOP_CHECKOUT_BASE = 'https://whop.com/checkout';

const tiers = [
  {
    name: 'BASIC',
    price: 39,
    period: '/month',
    productId: 'prod_74ZbiZNaL4cai',
    icon: Zap,
    color: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    features: [
      'Unlimited CIS Analysis Runs',
      '5 Side-Bet Predictions/Day',
      'Basic Strategy Engine',
      'Session Tracking',
      'Email Support',
    ],
    cta: 'Start Winning',
  },
  {
    name: 'ELITE',
    price: 89,
    period: '/month',
    productId: 'prod_Q2f69D9yoibIF',
    icon: Flame,
    color: 'from-primary/30 to-primary/10',
    borderColor: 'border-primary/50',
    glowColor: 'shadow-[0_0_40px_rgba(45,212,191,0.4)]',
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited Side-Bet Predictions',
      'Dealer Pattern Analysis',
      'Hit Probability Matrix',
      'Insurance Recommendations',
      'Camera Card Scanner',
      'Priority Support',
    ],
    cta: 'Go Elite',
  },
  {
    name: 'BLACKOUT',
    price: 149,
    period: '/month',
    productId: 'prod_j7VCmjRcU8V38',
    icon: Crown,
    color: 'from-purple-500/30 to-purple-600/10',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
    features: [
      'Everything in Elite',
      'Turbo Mode (3x Speed)',
      'Advanced Forecasting',
      'High-Frequency CIS',
      'Exclusive Themes',
      'VIP Discord Access',
      '24/7 Priority Support',
    ],
    cta: 'Unlock Blackout',
  },
  {
    name: 'LIFETIME',
    price: 499,
    period: 'one-time',
    productId: 'prod_r4dkfZZZT0UFf',
    icon: Star,
    color: 'from-amber-500/30 to-amber-600/10',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-[0_0_50px_rgba(245,158,11,0.5)]',
    features: [
      'All Blackout Features',
      'Permanent Full Access',
      'Never Pay Again',
      'VIP Theme Collection',
      'Founding Member Badge',
      'Direct Developer Access',
      'Future Updates Included',
    ],
    cta: 'Own It Forever',
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  const handleCheckout = (productId: string) => {
    window.open(`${WHOP_CHECKOUT_BASE}/${productId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20"
        >
          {/* Brand logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.img
              src={syndicateLogo}
              alt="Syndicate Supremacy"
              className="w-16 h-16 md:w-20 md:h-20"
              animate={{ 
                filter: [
                  'drop-shadow(0 0 10px rgba(45,212,191,0.3))',
                  'drop-shadow(0 0 25px rgba(45,212,191,0.6))',
                  'drop-shadow(0 0 10px rgba(45,212,191,0.3))',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
            <motion.img
              src={neon21Logo}
              alt="Neon21"
              className="w-14 h-14 md:w-16 md:h-16"
              animate={{ 
                filter: [
                  'drop-shadow(0 0 10px rgba(6,182,212,0.3))',
                  'drop-shadow(0 0 25px rgba(6,182,212,0.6))',
                  'drop-shadow(0 0 10px rgba(6,182,212,0.3))',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </div>

          {/* Announcement badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-primary font-mono text-sm uppercase tracking-wider">
              Syndicate Supremacy's First Digital Product
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-black mb-4"
          >
            <span className="text-foreground">THE TOOL THAT</span>
            <br />
            <span 
              className="bg-clip-text text-transparent"
              style={{
                background: 'linear-gradient(135deg, hsl(175 100% 45%) 0%, hsl(175 100% 65%) 50%, hsl(280 100% 70%) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              PRINTS MONEY
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8"
          >
            Neon21 uses advanced AI to give you the edge at every blackjack table. 
            <span className="text-primary font-semibold"> Stop guessing. Start winning.</span>
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-8 md:gap-12"
          >
            {[
              { value: '99.7%', label: 'Accuracy' },
              { value: '3x', label: 'Faster Decisions' },
              { value: '∞', label: 'Edge' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-black text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-primary/30">
                    Most Popular
                  </div>
                </div>
              )}
              
              <Card className={`relative h-full bg-gradient-to-b ${tier.color} ${tier.borderColor} border-2 backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-transform duration-300 ${tier.popular ? tier.glowColor : ''}`}>
                {/* Hover glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${tier.glowColor}`} />
                
                <div className="relative p-6">
                  {/* Tier icon and name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-background/50 ${tier.borderColor} border`}>
                      <tier.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg tracking-wider">{tier.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl md:text-5xl font-display font-black text-foreground">${tier.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCheckout(tier.productId)}
                    className={`w-full group/btn ${tier.popular ? 'bg-primary hover:bg-primary/90' : 'bg-background/50 hover:bg-background/80 border border-border'}`}
                    size="lg"
                  >
                    <span>{tier.cta}</span>
                    <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/auth')} 
              className="text-primary hover:underline font-semibold"
            >
              Sign in here
            </button>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-sm">
            <span>Powered by</span>
            <span className="font-display font-bold text-muted-foreground">SYNDICATE SUPREMACY</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
