import { votes, voteRecords, getNextId, persistData, households } from '../db/mockData';
import type { Vote } from '../../shared/types';

const DEFAULT_HOUSEHOLD_ID = 1;

function checkAndUpdateVoteStatus() {
  let changed = false;
  votes.forEach(vote => {
    if (vote.status === 'ongoing' && new Date(vote.deadline) < new Date()) {
      vote.status = 'ended';
      changed = true;
    }
  });
  if (changed) {
    persistData();
  }
}

function enrichVote(vote: Vote, householdId: number): Vote {
  const records = voteRecords.filter(vr => vr.voteId === vote.id);
  const results = vote.options.map((_, i) =>
    records.filter(r => r.optionIndex === i).length
  );
  const userVote = records.find(r => r.householdId === householdId);

  return {
    ...vote,
    results,
    totalVotes: records.length,
    hasVoted: !!userVote,
    userVote: userVote?.optionIndex,
  };
}

export function getVotes(householdId: number = DEFAULT_HOUSEHOLD_ID) {
  checkAndUpdateVoteStatus();
  const sorted = [...votes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.map(v => enrichVote(v, householdId));
}

export function getVoteById(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  checkAndUpdateVoteStatus();
  const vote = votes.find(v => v.id === id);
  if (!vote) return null;
  return enrichVote(vote, householdId);
}

export function castVote(voteId: number, optionIndex: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  checkAndUpdateVoteStatus();
  const vote = votes.find(v => v.id === voteId);
  if (!vote) return { success: false, message: '投票不存在' };
  if (vote.status === 'ended') return { success: false, message: '投票已结束' };
  if (new Date(vote.deadline) < new Date()) return { success: false, message: '投票已截止' };

  const existingVote = voteRecords.find(
    vr => vr.voteId === voteId && vr.householdId === householdId
  );
  if (existingVote) return { success: false, message: '您已投票，不能重复投票' };

  voteRecords.push({
    id: getNextId('voteRecord'),
    voteId,
    householdId,
    optionIndex,
    votedAt: new Date().toISOString(),
  });
  persistData();

  return { success: true };
}

export function createVote(data: {
  title: string;
  description: string;
  options: string[];
  deadline: string;
}) {
  const newVote: Vote = {
    id: getNextId('vote'),
    title: data.title,
    description: data.description,
    options: data.options,
    deadline: data.deadline,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'ongoing',
    results: data.options.map(() => 0),
    totalVotes: 0,
    hasVoted: false,
  };

  votes.unshift(newVote);
  persistData();
  return newVote;
}

export function getOngoingVotesCount() {
  checkAndUpdateVoteStatus();
  return votes.filter(v => v.status === 'ongoing').length;
}

export function getVoteStatistics(voteId: number) {
  const vote = votes.find(v => v.id === voteId);
  if (!vote) return null;

  const records = voteRecords.filter(vr => vr.voteId === voteId);
  const totalHouseholds = households.length;
  const votedHouseholdIds = new Set(records.map(r => r.householdId));

  const byBuilding: Record<string, { total: number; voted: number; households: any[] }> = {};

  households.forEach(household => {
    if (!byBuilding[household.building]) {
      byBuilding[household.building] = { total: 0, voted: 0, households: [] };
    }
    byBuilding[household.building].total++;
    if (votedHouseholdIds.has(household.id)) {
      byBuilding[household.building].voted++;
    } else {
      byBuilding[household.building].households.push({
        id: household.id,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        ownerName: household.ownerName,
      });
    }
  });

  const votedHouseholds = households.filter(h => votedHouseholdIds.has(h.id));
  const notVotedHouseholds = households.filter(h => !votedHouseholdIds.has(h.id));

  return {
    voteId,
    voteTitle: vote.title,
    deadline: vote.deadline,
    status: vote.status,
    totalHouseholds,
    votedCount: records.length,
    notVotedCount: totalHouseholds - records.length,
    participationRate: totalHouseholds > 0 ? Math.round((records.length / totalHouseholds) * 100) : 0,
    byBuilding,
    votedHouseholds,
    notVotedHouseholds,
  };
}
