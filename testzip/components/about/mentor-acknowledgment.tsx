import { GraduationCap, Heart } from "lucide-react";

export function MentorAcknowledgment() {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-8 shadow-sm animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        <div className="rounded-full bg-primary/10 p-4">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Special Thanks to Our Mentor</h3>
          <p className="text-xl font-semibold text-primary">Professor ALAMI Lamrani</p>
        </div>
        
      
        
        <div className="flex items-center space-x-2 text-primary">
          <Heart className="h-5 w-5" />
          <span className="font-medium">With sincere appreciation</span>
        </div>
      </div>
    </div>
  );
} 