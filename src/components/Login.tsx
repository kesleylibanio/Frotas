import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { supabaseService } from '../services/supabaseService';

interface LoginProps {
  onLogin: (role: 'admin' | 'mechanic' | 'motorista', username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only letters, max 20 chars, lowercase
    const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ]/g, '').slice(0, 20).toLowerCase();
    setUsername(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password.length < 4 || password.length > 20) {
          setError('A senha deve ter entre 4 e 20 caracteres.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        
        await supabaseService.register(username, password);
        setSuccess('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const role = await supabaseService.login(username, password);
        if (role) {
          onLogin(role, username);
        } else {
          setError('Credenciais inválidas. Tente novamente.');
        }
      }
    } catch (err: any) {
      console.error('Erro:', err);
      if (err.code === '23505') {
        setError('Este nome de usuário já está em uso.');
      } else {
        setError('Erro ao conectar ao servidor. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-red-200">
            {isRegistering ? <UserPlus size={32} /> : <Lock size={32} />}
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            {isRegistering ? 'Cadastro de Motorista' : 'Acesso ao Sistema'}
          </h1>
          <p className="text-slate-500">
            {isRegistering ? 'Crie sua conta para solicitar manutenções' : 'Entre com suas credenciais para continuar'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={handleUsernameChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder={isRegistering ? "Apenas letras (máx 20)" : "Digite seu usuário"}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 20))}
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder={isRegistering ? "De 4 a 20 caracteres" : "Digite sua senha"}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.slice(0, 20))}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  placeholder="Confirme sua senha"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-emerald-600 text-sm font-medium text-center bg-emerald-50 p-2 rounded-lg"
            >
              {success}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {isRegistering ? 'Cadastrando...' : 'Entrando...'}
              </>
            ) : (
              isRegistering ? 'Cadastrar' : 'Entrar'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
