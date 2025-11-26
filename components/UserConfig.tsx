import React from 'react';
import { UserProfile, UserID } from '../types';
import { User, Edit3 } from 'lucide-react';

interface UserConfigProps {
  users: Record<string, UserProfile>;
  onUpdateUser: (id: UserID, name: string) => void;
}

export const UserConfig: React.FC<UserConfigProps> = ({ users, onUpdateUser }) => {
  return (
    <div className="flex items-center justify-center gap-8 mb-6">
      {(['userA', 'userB'] as UserID[]).map((id) => (
        <div key={id} className="flex items-center gap-2 group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm
              ${users[id].themeColor === 'teal' ? 'bg-teal-400' : 'bg-rose-400'}
            `}>
                {users[id].name.charAt(0).toUpperCase()}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={users[id].name}
                    onChange={(e) => onUpdateUser(id, e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-400 focus:outline-none text-slate-600 font-medium px-1 py-0.5 w-24 text-center transition-all"
                />
                <Edit3 size={12} className="absolute -right-4 top-1.5 text-slate-300 opacity-0 group-hover:opacity-100" />
            </div>
        </div>
      ))}
    </div>
  );
};
