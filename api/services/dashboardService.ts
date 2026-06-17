import { households } from '../db/mockData';
import { getPaidCount } from './propertyFeeService';
import { getOngoingVotesCount } from './voteService';
import { getPendingCount } from './complaintService';
import { getFundRecords } from './maintenanceFundService';
import { propertyFees } from '../db/mockData';

export function getDashboardStats() {
  const totalHouseholds = households.length;
  const unpaidTotal = propertyFees
    .filter(f => f.status === 'unpaid' || f.status === 'overdue')
    .reduce((sum, f) => sum + f.amount, 0);

  const fundData = getFundRecords(1, 1);

  return {
    totalHouseholds,
    paidHouseholds: getPaidCount(),
    ongoingVotes: getOngoingVotesCount(),
    pendingComplaints: getPendingCount(),
    unpaidTotal,
    fundBalance: fundData.balance,
  };
}
