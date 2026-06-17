import { votes, voteRecords, getNextId } from '../db/mockData';
import type { Vote } from '../../shared/types';

const DEFAULT_HOUSEHOLD_ID = 1;

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
  const sorted = [...votes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.map(v => enrichVote(v, householdId));
}

export function getVoteById(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const vote = votes.find(v => v.id === id);
  if (!vote) return null;
  return enrichVote(vote, householdId);
}

export function castVote(voteId: number, optionIndex: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
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

  return { success: true };
}

export function getOngoingVotesCount() {
  return votes.filter(v => v.status === 'ongoing').length;
}
