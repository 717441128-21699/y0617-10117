import { useEffect, useState } from 'react';
import {
  Users,
  Phone,
  Mail,
  Briefcase,
  User as UserIcon,
  Building,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import type { CommitteeMember } from '../../shared/types';

export default function Committee() {
  const { committeeMembers, setCommitteeMembers } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommitteeMembers();
  }, []);

  const loadCommitteeMembers = async () => {
    setLoading(true);
    try {
      const response = await api.committee.getList();
      setCommitteeMembers(response.data);
    } catch (error) {
      console.error('加载业委会成员失败', error);
    } finally {
      setLoading(false);
    }
  };

  const positionColors: Record<string, string> = {
    '主任': 'from-primary-500 to-blue-600',
    '副主任': 'from-success-500 to-green-600',
    '委员': 'from-warning-500 to-orange-500',
    '秘书': 'from-purple-500 to-pink-500',
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-gray-800 flex items-center gap-3">
          <Users className="text-primary-600" />
          业主委员会
        </h1>
        <p className="text-gray-500 mt-1">认识为小区服务的业委会成员，了解他们的职责</p>
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Building size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">阳光花园业主委员会</h2>
            <p className="text-white/80">第三届业主委员会 · 任期 2024-2027</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-1">主任</p>
            <p className="text-xl font-bold">1 名</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-1">副主任</p>
            <p className="text-xl font-bold">2 名</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-1">委员</p>
            <p className="text-xl font-bold">4 名</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-1">秘书</p>
            <p className="text-xl font-bold">1 名</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committeeMembers.map((member, idx) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`bg-gradient-to-r ${positionColors[member.position] || 'from-gray-500 to-gray-600'} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-white/90 flex items-center gap-1">
                      <Briefcase size={16} />
                      {member.position}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={18} className="text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={18} className="text-gray-400" />
                    <span>{member.email}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <UserIcon size={14} />
                    工作职责
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.responsibilities.map((resp, ridx) => (
                      <span
                        key={ridx}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4">业主委员会职责</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            '召集业主大会会议，报告物业管理的实施情况',
            '代表业主与业主大会选聘的物业服务企业签订物业服务合同',
            '及时了解业主、物业使用人的意见和建议，监督和协助物业服务企业履行物业服务合同',
            '监督管理规约的实施',
            '业主大会赋予的其他职责',
            '定期向业主公布维修基金收支情况',
            '协调处理业主之间的矛盾纠纷',
            '组织业主参与小区公共事务管理',
          ].map((duty, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-sm font-bold">{idx + 1}</span>
              </div>
              <p className="text-gray-600 text-sm">{duty}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">联系我们</h3>
        <p className="text-blue-700 text-sm">
          如果您有任何问题或建议，欢迎联系业委会成员。我们将竭诚为您服务，共同建设美好家园。
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="mailto:committee@sunshine-garden.com"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Mail size={16} />
            发送邮件
          </a>
          <a
            href="tel:010-12345678"
            className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Phone size={16} />
            电话联系
          </a>
        </div>
      </div>
    </div>
  );
}
