import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Waves } from '@/components/ui/waves-background';
const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const features = [{
    title: 'Contact Management',
    description: 'Organize and manage your contacts with ease.',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  }, {
    title: 'Sales Pipeline',
    description: 'Track deals and visualize your sales pipeline.',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  }, {
    title: 'Email Campaigns',
    description: 'Create and send targeted email campaigns.',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  }, {
    title: 'Calendar Integration',
    description: 'Schedule and manage your appointments.',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  }];
  return <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-poetsen text-orange-500 text-center text-5xl">Golly</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm hover:text-gray-600 transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-gray-600 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm hover:text-gray-600 transition-colors">FAQ</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Waves Background - only in hero section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Waves Background - only in hero section - Changed line color to orange */}
        <div className="absolute inset-0 z-0">
          <Waves lineColor="rgba(249, 115, 22, 0.25)" backgroundColor="transparent" waveSpeedX={0.015} waveSpeedY={0.01} waveAmpX={35} waveAmpY={20} xGap={12} yGap={36} friction={0.9} tension={0.01} maxCursorMove={120} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7
          }} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Simple CRM for growth</motion.h1>
            
            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.2
          }} className="text-lg md:text-xl text-gray-600 mb-8">Take the complex out of your day at half the cost</motion.p>
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.4
          }} className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="px-8">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
        
        <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 1.5,
        repeat: Infinity,
        repeatType: "reverse"
      }} className="flex justify-center mt-16 relative z-10">
          <a href="#features" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
            <span className="text-sm mb-1">Scroll to learn more</span>
            <ChevronDown className="h-5 w-5" />
          </a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Golly offers a range of powerful features designed to streamline your business operations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <CardTitle>{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Affordable plans for businesses of all sizes.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} viewport={{
            once: true
          }}>
              <Card className="h-full backdrop-blur-sm bg-white/80">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <div className="mt-3 text-3xl font-bold">$9<span className="text-sm font-normal text-gray-500">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Up to 100 contacts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Basic pipeline management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Email integration</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Choose Plan</Button>
                </CardFooter>
              </Card>
            </motion.div>
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0,
            scale: 1.05
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} viewport={{
            once: true
          }} className="md:transform md:-translate-y-4">
              <Card className="h-full border-primary bg-primary bg-opacity-5 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Professional</CardTitle>
                    <span className="bg-primary text-white text-xs py-1 px-2 rounded-full">Popular</span>
                  </div>
                  <div className="mt-3 text-3xl font-bold">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Unlimited contacts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Advanced pipeline management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Email campaigns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Calendar integration</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Choose Plan</Button>
                </CardFooter>
              </Card>
            </motion.div>
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.2
          }} viewport={{
            once: true
          }}>
              <Card className="h-full backdrop-blur-sm bg-white/80">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="mt-3 text-3xl font-bold">$99<span className="text-sm font-normal text-gray-500">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Everything in Professional</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                    </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Dedicated support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Custom integrations</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Find answers to common questions about Golly</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} transition={{
            duration: 0.5
          }} viewport={{
            once: true
          }} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">What is Golly?</h3>
                <p className="text-gray-600">Golly is a customer relationship management platform designed to help individuals and businesses manage contacts, track sales opportunities, and streamline their operations.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">How can I get started?</h3>
                <p className="text-gray-600">Getting started is easy! Simply sign up for an account, and you'll be guided through the initial setup process. You can import your existing contacts and start using the platform right away.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Can I integrate with other tools?</h3>
                <p className="text-gray-600">Yes, Golly integrates with a variety of popular tools, including Gmail, Outlook, and various calendar applications. More integrations are being added regularly.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Is my data secure?</h3>
                <p className="text-gray-600">Absolutely. We take data security very seriously. All your data is encrypted, and we follow industry-standard security practices to ensure your information is protected.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary relative z-10">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.7
        }} viewport={{
          once: true
        }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to grow your business?</h2>
            <p className="text-lg text-white opacity-90 mb-8">Join thousands of businesses already using Golly to manage their customer relationships and Grow!</p>
            <Link to="/auth/register">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
                Get Started for Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer - Updated background to black */}
      <footer className="bg-black text-gray-400 py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4 text-orange-500">Golly</h3>
              <p className="text-sm">Simple CRM for growing business</p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            <p>© {new Date().getFullYear()} Golly CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;