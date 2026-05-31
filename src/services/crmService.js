import { supabase } from '../lib/supabase';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDisplay = (isoStr) => {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return isoStr || '—'; }
};

// ── Column sets ────────────────────────────────────────────────────────────────
// LIST: excludes large text blobs not needed for the table/kanban/dashboard view.
// The omitted columns (remarks, delivery_details, payment_terms, quote_desc) are
// fetched on demand via getOneFunnel() when the ViewDrawer is opened.
const FUNNEL_LIST_COLS = [
  'id','name','phone','email','city_region','enquiry_type','funnel_type',
  'lead_source','next_follow_up','products','assigned_to','created_by',
  'created_at','status','lost_drop_reason','is_existing',
  'quote_amount','quote_qty','order_number','quotation_no','won_proof_url',
].join(',');

// FULL: everything (for ViewDrawer + FunnelForm edit)
const FUNNEL_FULL_COLS = '*';

// ── Request deduplication registry ────────────────────────────────────────────
// If getAllFunnels() is called twice before the first resolves (e.g. double-mount
// in StrictMode), only one network request is made.
const _inFlight = {};

export const crmService = {

  // ─── FETCH ALL FUNNELS (list columns only) ────────────────────────────────
  async getAllFunnels() {
    if (_inFlight.getAllFunnels) return _inFlight.getAllFunnels;

    _inFlight.getAllFunnels = (async () => {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select(FUNNEL_LIST_COLS)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(this.mapFromDb);
      } catch (err) {
        console.error('Error in getAllFunnels:', err.message);
        return [];
      } finally {
        delete _inFlight.getAllFunnels;
      }
    })();

    return _inFlight.getAllFunnels;
  },

  // ─── FETCH ONE FUNNEL (all columns — called when ViewDrawer opens) ─────────
  async getOneFunnel(id) {
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select(FUNNEL_FULL_COLS)
        .eq('id', id)
        .single();
      if (error) throw error;
      return this.mapFromDb(data);
    } catch (err) {
      console.error('Error in getOneFunnel:', err.message);
      throw err;
    }
  },

  // ─── SAVE FUNNEL (INSERT / UPDATE) ────────────────────────────────────────
  async saveFunnel(funnel, user) {
    try {
      const dbData = this.mapToDb(funnel);
      if (!dbData.lead_source) throw new Error('lead_source is required');
      if (!funnel.isExisting && funnel.status !== 'Won' && !dbData.next_follow_up) {
        throw new Error('next_follow_up is required');
      }
      dbData.created_by = user?.name || 'admin';

      if (funnel.id) {
        const { data, error } = await supabase
          .from('funnels').update(dbData).eq('id', funnel.id).select();
        if (error) throw error;
        return this.mapFromDb(data[0]);
      }

      const { data, error } = await supabase
        .from('funnels').insert([dbData]).select();
      if (error) throw error;
      return this.mapFromDb(data[0]);
    } catch (error) {
      console.error('Error in saveFunnel:', error.message);
      throw error;
    }
  },

  // ─── UPDATE STATUS ────────────────────────────────────────────────────────
  async updateStatus(id, status, lostDropReason = '') {
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ status, lost_drop_reason: lostDropReason || null })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  },

  // ─── DELETE FUNNEL ────────────────────────────────────────────────────────
  async deleteFunnel(id) {
    try {
      const { error } = await supabase.from('funnels').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting funnel:', error.message);
      throw error;
    }
  },

  // ─── COMMENTS ─────────────────────────────────────────────────────────────
  async getComments(funnelId) {
    try {
      const { data, error } = await supabase
        .from('audit_comments').select('*')
        .eq('funnel_id', funnelId).order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({
        text: c.text, author: c.author, role: c.role,
        time: formatDisplay(c.created_at),
      }));
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      return [];
    }
  },

  async addComment(funnelId, comment) {
    try {
      const { error } = await supabase.from('audit_comments').insert([{
        funnel_id: funnelId, author: comment.author,
        role: comment.role, text: comment.text,
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('Error adding comment:', error.message);
    }
  },

  // ─── FOLLOW-UP LOGS ───────────────────────────────────────────────────────
  async getFollowupLogs(funnelId) {
    try {
      const { data, error } = await supabase
        .from('followup_logs').select('*')
        .eq('funnel_id', funnelId).order('logged_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(row => ({
        id:               row.id,
        loggedBy:         row.logged_by,
        loggedAt:         formatDisplay(row.logged_at),
        followUpDate:     row.follow_up_date,
        customerResponse: row.customer_response,
        outcome:          row.outcome,
        nextFollowUp:     row.next_follow_up,
      }));
    } catch (error) {
      console.error('Error fetching followup logs:', error.message);
      return [];
    }
  },

  async addFollowupLog(funnelId, log) {
    try {
      const { data, error } = await supabase
        .from('followup_logs')
        .insert({
          funnel_id:         funnelId,
          logged_by:         log.loggedBy,
          follow_up_date:    log.followUpDate || null,
          customer_response: log.customerResponse,
          outcome:           log.outcome,
          next_follow_up:    log.nextFollowUp || null,
        })
        .select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding followup log:', error.message);
      throw error;
    }
  },

  async updateNextFollowup(funnelId, date) {
    try {
      const { error } = await supabase
        .from('funnels').update({ next_follow_up: date || null }).eq('id', funnelId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating next followup:', error.message);
      throw error;
    }
  },

  // ─── USERS ────────────────────────────────────────────────────────────────
  async getUsers() {
    try {
      const { data, error } = await supabase.from('users').select('id,name,username,role,created_at');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }
  },

  async saveUsers(users) {
    try {
      for (const user of users) {
        const { id, ...rest } = user;
        const isUuid = typeof id === 'string' && id.length > 20;
        const payload = isUuid ? { id, ...rest } : rest;
        const { error } = await supabase
          .from('users').upsert(payload, { onConflict: 'username' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving users:', error.message);
      throw error;
    }
  },

  async deleteUser(username) {
    try {
      const { error } = await supabase.from('users').delete().eq('username', username);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error.message);
    }
  },

  // ─── SALES TARGETS ───────────────────────────────────────────────────────
  async getAllTargets() {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .select('*')
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data || []).map(t => ({
        id:             t.id,
        assignedTo:     t.assigned_to,
        periodType:     t.period_type,
        periodStart:    t.period_start,
        periodEnd:      t.period_end,
        targetDeals:    t.target_deals,
        targetRevenue:  t.target_revenue,
        setBy:          t.set_by,
        notes:          t.notes || '',
        createdAt:      t.created_at,
        updatedAt:      t.updated_at,
      }));
    } catch (err) {
      console.error('Error in getAllTargets:', err.message);
      return [];
    }
  },

  async upsertTarget(target) {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .upsert({
          assigned_to:    target.assignedTo,
          period_type:    target.periodType,
          period_start:   target.periodStart,
          period_end:     target.periodEnd,
          target_deals:   Number(target.targetDeals)   || 0,
          target_revenue: Number(target.targetRevenue) || 0,
          set_by:         target.setBy,
          notes:          target.notes || null,
          updated_at:     new Date().toISOString(),
        }, { onConflict: 'assigned_to,period_type,period_start' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error in upsertTarget:', err.message);
      throw err;
    }
  },

  async deleteTarget(id) {
    try {
      const { error } = await supabase.from('sales_targets').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteTarget:', err.message);
      throw err;
    }
  },

  // ─── TASKS ───────────────────────────────────────────────────────────────
  mapTaskToDb(t) {
    return {
      title:         t.title,
      type:          t.type          || 'Call',
      priority:      t.priority      || 'Medium',
      due_date:      t.dueDate       || null,
      due_time:      t.dueTime       || null,
      note:          t.note          || null,
      linked_funnel: t.linkedFunnel  || null,
      assigned_to:   t.assignedTo    || null,
      created_by:    t.createdBy,
      done:          t.done          || false,
      progress_pct:  t.progressPct   || 0,
      done_at:       t.doneAt        || null,
      done_at_iso:   t.doneAtIso     || null,
      status:        t.status        || null,
      updates:       t.updates       || [],
    };
  },

  mapTaskFromDb(t) {
    if (!t) return null;
    return {
      id:           t.id,
      title:        t.title,
      type:         t.type,
      priority:     t.priority,
      dueDate:      t.due_date,
      dueTime:      t.due_time,
      note:         t.note,
      linkedFunnel: t.linked_funnel,
      assignedTo:   t.assigned_to,
      createdBy:    t.created_by,
      done:         t.done,
      progressPct:  t.progress_pct   || 0,
      doneAt:       t.done_at,
      doneAtIso:    t.done_at_iso,
      status:       t.status,
      updates:      t.updates        || [],
      createdAt:    t.created_at,
      updatedAt:    t.updated_at,
    };
  },

  async getAllTasks() {
    if (_inFlight.getAllTasks) return _inFlight.getAllTasks;

    _inFlight.getAllTasks = (async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id,title,type,priority,due_date,due_time,note,linked_funnel,assigned_to,created_by,done,progress_pct,done_at,done_at_iso,status,updates,created_at,updated_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(t => this.mapTaskFromDb(t));
      } catch (err) {
        console.error('Error in getAllTasks:', err.message);
        return [];
      } finally {
        delete _inFlight.getAllTasks;
      }
    })();

    return _inFlight.getAllTasks;
  },

  async createTask(task) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(this.mapTaskToDb(task))
        .select()
        .single();
      if (error) throw error;
      return this.mapTaskFromDb(data);
    } catch (err) {
      console.error('Error in createTask:', err.message);
      throw err;
    }
  },

  async updateTask(id, task) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ ...this.mapTaskToDb(task), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error in updateTask:', err.message);
      throw err;
    }
  },

  async deleteTask(id) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteTask:', err.message);
      throw err;
    }
  },

  // ─── CONTACT SEGMENTS ────────────────────────────────────────────────────
  async getAllSegments() {
    try {
      const { data, error } = await supabase
        .from('contact_segments')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(s => ({
        id:          s.id,
        name:        s.name,
        color:       s.color,
        description: s.description || '',
        filters:     s.filters     || {},
        createdBy:   s.created_by,
        createdAt:   s.created_at,
      }));
    } catch (err) {
      console.error('Error in getAllSegments:', err.message);
      return [];
    }
  },

  async createSegment(seg) {
    try {
      const { data, error } = await supabase
        .from('contact_segments')
        .insert({
          name:        seg.name,
          color:       seg.color       || '#5B3BE8',
          description: seg.description || '',
          filters:     seg.filters     || {},
          created_by:  seg.createdBy   || 'admin',
        })
        .select()
        .single();
      if (error) throw error;
      return { id:data.id, name:data.name, color:data.color, description:data.description, filters:data.filters, createdBy:data.created_by, createdAt:data.created_at };
    } catch (err) {
      console.error('Error in createSegment:', err.message);
      throw err;
    }
  },

  async deleteSegment(id) {
    try {
      const { error } = await supabase.from('contact_segments').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteSegment:', err.message);
      throw err;
    }
  },

  // ─── WON PROOF ────────────────────────────────────────────────────────────
  async updateWonProof(id, url) {
    try {
      const { error } = await supabase
        .from('funnels').update({ won_proof_url: url || null }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating won proof:', error.message);
      throw error;
    }
  },

  // ─── MAP TO DB (camelCase → snake_case) ──────────────────────────────────
  mapToDb(f) {
    const isNum = v => v !== '' && v !== null && v !== undefined;
    return {
      name:             f.name,
      phone:            f.phone            || null,
      email:            f.email            || null,
      city_region:      f.cityRegion       || null,
      enquiry_type:     f.enquiryType      || null,
      funnel_type:      f.funnelType       || null,
      lead_source:      f.leadSource,
      next_follow_up:   f.nextFollowUp     || null,
      products:         f.products         || [],
      remarks:          f.remarks          || null,
      delivery_details: f.deliveryDetails  || null,
      payment_terms:    f.paymentTerms     || null,
      assigned_to:      f.assignedTo       || null,
      quotation_no:     f.quotationNo      || null,
      order_number:     f.orderNumber      || null,
      quote_qty:        isNum(f.quoteQty)    ? Number(f.quoteQty)    : null,
      quote_amount:     isNum(f.quoteAmount) ? Number(f.quoteAmount) : null,
      quote_desc:       f.quoteDesc        || null,
      status:           f.status           || 'Pending',
      lost_drop_reason: f.lostDropReason   || null,
      won_proof_url:    f.wonProofUrl      || null,
      is_existing:      f.isExisting       || false,
    };
  },

  // ─── MAP FROM DB (snake_case → camelCase) ────────────────────────────────
  // IMPORTANT: createdAt is kept as ISO string for reliable date math.
  // Format it at display time using formatDisplay() or toLocaleDateString().
  mapFromDb(f) {
    if (!f) return null;
    return {
      id:              f.id,
      name:            f.name,
      phone:           f.phone,
      email:           f.email,
      cityRegion:      f.city_region,
      enquiryType:     f.enquiry_type,
      funnelType:      f.funnel_type,
      leadSource:      f.lead_source,
      nextFollowUp:    f.next_follow_up,
      products:        f.products     || [],
      remarks:         f.remarks,
      deliveryDetails: f.delivery_details,
      paymentTerms:    f.payment_terms,
      quotationNo:     f.quotation_no     || '',
      orderNumber:     f.order_number,
      quoteQty:        f.quote_qty,
      quoteAmount:     f.quote_amount,
      quoteDesc:       f.quote_desc,
      status:          f.status,
      // ← ISO string preserved for date math; display with formatDisplay()
      createdAt:       f.created_at,
      createdBy:       f.created_by,
      assignedTo:      f.assigned_to  || null,
      lostDropReason:  f.lost_drop_reason || '',
      wonProofUrl:     f.won_proof_url    || '',
      isExisting:      f.is_existing      || false,
    };
  },

  // ─── BULK UPDATE ─────────────────────────────────────────────────────────────
  async bulkUpdate(ids, fields) {
    if (!ids || ids.length === 0) return;
    try {
      const updates = {};
      if (fields.status        !== undefined) updates.status           = fields.status;
      if (fields.assignedTo    !== undefined) updates.assigned_to      = fields.assignedTo || null;
      if (fields.nextFollowUp  !== undefined) updates.next_follow_up   = fields.nextFollowUp || null;
      if (fields.funnelType    !== undefined) updates.funnel_type      = fields.funnelType || null;
      if (fields.leadSource    !== undefined) updates.lead_source      = fields.leadSource;
      if (fields.lostDropReason!== undefined) updates.lost_drop_reason = fields.lostDropReason || null;
      if (Object.keys(updates).length === 0) return;
      const { error } = await supabase
        .from('funnels')
        .update(updates)
        .in('id', ids);
      if (error) throw error;
    } catch (error) {
      console.error('Error in bulkUpdate:', error.message);
      throw error;
    }
  },

  // ─── UPLOAD FILE (Base64 → Supabase Storage) ─────────────────────────────────
  async uploadProofImage(funnelId, file) {
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `proofs/${funnelId}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('ekanta-proofs')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('ekanta-proofs')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error.message);
      throw error;
    }
  },

  // ─── TEAM CHAT ───────────────────────────────────────────────────────────────
  dmChannel(a, b) {
    return 'dm_' + [a, b].sort().join('___');
  },

  async getChatMessages(channel, limit = 60) {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data || []).map(m => ({
        id:         m.id,
        channel:    m.channel,
        sender:     m.sender,
        senderRole: m.sender_role,
        text:       m.text || "",
        imageUrl:   m.image_url || null,
        mentions:   m.mentions || [],
        createdAt:  m.created_at,
        editedAt:   m.edited_at || null,
        isDeleted:  m.is_deleted || false,
      }));
    } catch (err) {
      console.error('getChatMessages:', err.message);
      return [];
    }
  },

  async sendChatMessage(channel, sender, senderRole, text, mentions = [], imageUrl = null) {
    try {
      const payload = { channel, sender, sender_role: senderRole, text };
      if (mentions && mentions.length > 0) payload.mentions = mentions;
      if (imageUrl) payload.image_url = imageUrl;

      const { data, error } = await supabase
        .from('team_messages')
        .insert(payload)
        .select('*');

      if (error) {
        console.error('sendChatMessage error:', error.code, error.message, error.details, error.hint);
        throw new Error(error.message || 'Failed to save message');
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('No data returned from insert');
      return {
        id:         row.id,
        channel:    row.channel,
        sender:     row.sender,
        senderRole: row.sender_role,
        text:       row.text,
        mentions:   row.mentions || [],
        createdAt:  row.created_at,
      };
    } catch (err) {
      console.error('sendChatMessage failed:', err.message);
      throw err;
    }
  },

  async editChatMessage(id, newText) {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ text: newText, edited_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('editChatMessage:', err.message);
      throw err;
    }
  },

  async deleteChatMessage(id) {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('deleteChatMessage:', err.message);
      throw err;
    }
  },

  async uploadChatImage(file) {
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `chat/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('ekanta-proofs')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('ekanta-proofs').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('uploadChatImage:', err.message);
      throw err;
    }
  },

  async getUnreadCounts(username) {
    // Returns channel → last_seen timestamp stored in localStorage
    try {
      const key = `ek_chat_seen_${username}`;
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch { return {}; }
  },

  markChannelRead(username, channel) {
    try {
      const key = `ek_chat_seen_${username}`;
      const seen = JSON.parse(localStorage.getItem(key) || '{}');
      seen[channel] = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(seen));
    } catch {}
  },
};
