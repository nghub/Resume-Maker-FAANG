import React from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Award } from 'lucide-react';
import { PersonalInfo, Skill } from '../types';

interface ProfileSidebarProps {
  info: PersonalInfo;
  skills: Skill[];
  certs: string[];
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ info, skills, certs }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2 h-2 rounded-full ${
              star <= rating ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-900 p-6 text-white">
        <h2 className="text-xl font-bold">{info.name || 'Candidate Name'}</h2>
        <p className="text-indigo-300 text-sm mt-1">{info.title || 'Role Title'}</p>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Personal Info</h3>
          <div className="space-y-2 text-sm">
            {info.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {info.phone}
              </div>
            )}
            {info.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${info.email}`} className="hover:text-indigo-600 truncate">{info.email}</a>
              </div>
            )}
            {info.location && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {info.location}
              </div>
            )}
            {info.linkedin && (
              <div className="flex items-center gap-2 text-slate-600">
                <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                <a href={info.linkedin} target="_blank" rel="noreferrer" className="hover:text-indigo-600 truncate">LinkedIn Profile</a>
              </div>
            )}
            {info.website && (
              <div className="flex items-center gap-2 text-slate-600">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <a href={info.website} target="_blank" rel="noreferrer" className="hover:text-indigo-600 truncate">Portfolio</a>
              </div>
            )}
          </div>
        </div>

        {/* Certifications */}
        {certs && certs.length > 0 && (
           <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Certifications</h3>
             <div className="flex flex-wrap gap-2">
               {certs.map((cert, i) => (
                 <div key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5">
                   <Award className="w-3 h-3" />
                   {cert}
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Skills</h3>
          <div className="space-y-3">
            {skills.slice(0, 8).map((skill, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">{skill.name}</span>
                {renderStars(skill.rating)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;