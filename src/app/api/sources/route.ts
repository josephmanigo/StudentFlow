import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { deleteChunksBySource } from '@/lib/rag';

/**
 * GET /api/sources?userId=xxx
 * Returns all notebook_sources for the user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('notebook_sources')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data ?? [] });
}

/**
 * DELETE /api/sources?sourceId=xxx&userId=xxx
 * Deletes a notebook source and all its document_chunks.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');
  const userId = searchParams.get('userId');

  if (!sourceId || !userId) {
    return NextResponse.json({ error: 'sourceId and userId are required' }, { status: 400 });
  }

  // Verify ownership before deleting
  const { data: source, error: fetchError } = await supabaseAdmin
    .from('notebook_sources')
    .select('id, user_id')
    .eq('id', sourceId)
    .single();

  if (fetchError || !source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  if (source.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete chunks first, then the source record (cascade also handles this but explicit is safer)
  await deleteChunksBySource(sourceId);

  const { error: deleteError } = await supabaseAdmin
    .from('notebook_sources')
    .delete()
    .eq('id', sourceId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
