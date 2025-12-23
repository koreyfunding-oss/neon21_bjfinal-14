import { motion } from 'framer-motion';
import { Zap, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';
import { useNavigate } from 'react-router-dom';

const WHOP_CHECKOUT_BASE = 'https://whop.com/checkout';
const PRODUCT_ID = 'prod_74ZbiZNaL4cai'; // Update this with your actual Whop product ID for $19.82/week

const features = [
  'Manual Card Input System',
  'Real-Time CIS Analysis',
  'Dealer Card Tracking',
  'Basic Strategy Engine',
  'Side-Bet Predictions',
  'Session Stats & Tracking',
  'Hit Probability Matrix',
  'Insurance Analysis',
  'All Premium Features Included',
];

export default function Pricing() {
  const navigate = useNavigate();

  const handleCheckout = () => {
    window.open(`${WHOP_CHECKOUT_BASE}/${PRODUCT_ID}`, '_blank');
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
          className="text-center mb-12 md:mb-16"
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

        {/* Single Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-lg mx-auto mb-16"
        >
          <Card className="relative bg-gradient-to-b from-primary/30 to-primary/10 border-primary/50 border-2 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(45,212,191,0.4)]">
            {/* Popular badge */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-20">
              <div className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider rounded-b-xl shadow-lg shadow-primary/30">
                Full Access
              </div>
            </div>
            
            <div className="relative p-8 pt-12">
              {/* Tier icon and name */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-background/50 border-primary/50 border">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl tracking-wider">NEON21 PRO</h3>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <span className="text-6xl md:text-7xl font-display font-black text-foreground">$19.82</span>
                <span className="text-muted-foreground text-lg ml-2">/week</span>
                <p className="text-muted-foreground text-sm mt-2">Cancel anytime</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
                size="lg"
              >
                <span>Get Started Now</span>
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>

              {/* Money back guarantee */}
              <p className="text-center text-muted-foreground text-sm mt-4">
                🔒 Secure checkout powered by Whop
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
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
