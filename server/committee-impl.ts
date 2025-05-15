import { committees, committeeMembers, users, type Committee, type CommitteeMember, type User } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export async function getCommittee(id: number): Promise<Committee | undefined> {
  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, id));
  
  if (committee) {
    const members = await getCommitteeMembers(id);
    return {
      ...committee,
      members
    };
  }
  
  return committee;
}

export async function getAllCommittees(): Promise<Committee[]> {
  const committeesList = await db
    .select()
    .from(committees)
    .orderBy(desc(committees.startDate));
  
  return committeesList;
}

export async function getActiveCommittees(): Promise<Committee[]> {
  const committeesList = await db
    .select()
    .from(committees)
    .where(eq(committees.active, true))
    .orderBy(desc(committees.startDate));
  
  return committeesList;
}

export async function getCommitteeMembers(committeeId: number): Promise<CommitteeMember[]> {
  const members = await db
    .select({
      committeeId: committeeMembers.committeeId,
      userId: committeeMembers.userId,
      role: committeeMembers.role,
      createdAt: committeeMembers.createdAt,
      updatedAt: committeeMembers.updatedAt
    })
    .from(committeeMembers)
    .where(eq(committeeMembers.committeeId, committeeId));
  
  return members;
}

export async function createCommittee(committeeData: Partial<Committee>): Promise<Committee> {
  // Criar a comissão
  const [committee] = await db
    .insert(committees)
    .values({
      name: committeeData.name!,
      description: committeeData.description!,
      type: committeeData.type!, // "Permanente", "Temporária", ou "Extraordinária"
      startDate: committeeData.startDate!,
      endDate: committeeData.endDate!,
      active: committeeData.active ?? true
    })
    .returning();
  
  return committee;
}

export async function updateCommittee(id: number, committeeData: Partial<Committee>): Promise<Committee | undefined> {
  // Verificar se a comissão existe
  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, id));
  
  if (!committee) {
    return undefined;
  }
  
  // Atualizar a comissão
  const [updatedCommittee] = await db
    .update(committees)
    .set({
      ...committeeData,
      updatedAt: new Date()
    })
    .where(eq(committees.id, id))
    .returning();
  
  return updatedCommittee;
}

export async function deleteCommittee(id: number): Promise<boolean> {
  try {
    // Primeiro excluir membros associados
    await db
      .delete(committeeMembers)
      .where(eq(committeeMembers.committeeId, id));
    
    // Depois excluir a comissão
    const result = await db
      .delete(committees)
      .where(eq(committees.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting committee:", error);
    return false;
  }
}

export async function addCommitteeMember(committeeId: number, userId: string, role: string = "Membro"): Promise<CommitteeMember> {
  const [member] = await db
    .insert(committeeMembers)
    .values({
      committeeId,
      userId,
      role
    })
    .returning();
  
  return member;
}

export async function updateCommitteeMember(committeeId: number, userId: string, role: string): Promise<CommitteeMember | undefined> {
  try {
    // Verificar se o membro existe
    const [existingMember] = await db
      .select()
      .from(committeeMembers)
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      );
    
    if (!existingMember) {
      return undefined;
    }
    
    // Atualizar o membro
    const [updatedMember] = await db
      .update(committeeMembers)
      .set({
        role,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      )
      .returning();
    
    return updatedMember;
  } catch (error) {
    console.error("Error updating committee member:", error);
    return undefined;
  }
}

export async function removeCommitteeMember(committeeId: number, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(committeeMembers)
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      );
    
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error("Error removing committee member:", error);
    return false;
  }
}

export async function getCommitteeMembersWithUsers(committeeId: number): Promise<(CommitteeMember & { user: User })[]> {
  const members = await db
    .select({
      committeeId: committeeMembers.committeeId,
      userId: committeeMembers.userId,
      role: committeeMembers.role,
      createdAt: committeeMembers.createdAt,
      updatedAt: committeeMembers.updatedAt,
      user: users
    })
    .from(committeeMembers)
    .innerJoin(users, eq(committeeMembers.userId, users.id))
    .where(eq(committeeMembers.committeeId, committeeId));
  
  return members.map(member => ({
    committeeId: member.committeeId,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    user: member.user
  }));
}