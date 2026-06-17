import { committeeMembers } from '../db/mockData';

export function getCommitteeMembers() {
  return [...committeeMembers].sort((a, b) => a.id - b.id);
}
