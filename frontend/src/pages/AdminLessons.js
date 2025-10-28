import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function AdminLessons() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await axios.get(`/api/lessons?courseId=${courseId}`);
      setLessons(data.data || []);
      setLoading(false);
    }
    if (courseId) load();
  }, [courseId]);

  function onDragEnd(result) {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    const reordered = Array.from(lessons);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setLessons(reordered);
  }

  async function saveOrder() {
    const orderedIds = lessons.map(l => l._id);
    await axios.put('/api/lessons/reorder', { orderedIds });
    // Optional: refetch or toast
  }

  async function saveInline(id, patch) {
    const { data } = await axios.put(`/api/lessons/${id}`, patch);
    setLessons(prev => prev.map(l => (l._id === id ? data.data : l)));
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h2>Manage Lessons (Drag to reorder)</h2>
      <button onClick={saveOrder}>Save Order</button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="lessonList">
          {provided => (
            <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyle: 'none', padding: 0 }}>
              {lessons.map((lesson, index) => (
                <Draggable draggableId={lesson._id} index={index} key={lesson._id}>
                  {prov => (
                    <li
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      style={{ padding: '12px 16px', margin: '8px 0', background: '#f7f7f7', borderRadius: 8, ...prov.draggableProps.style }}
                    >
                      <InlineTitle lesson={lesson} onSave={saveInline} />
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function InlineTitle({ lesson, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title?.en || '');
  return editing ? (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(lesson._id, { title: { ...lesson.title, en: title } });
        setEditing(false);
      }}
    >
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <button type="submit">Save</button>
      <button type="button" onClick={() => setEditing(false)}>Cancel</button>
    </form>
  ) : (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <strong>#{lesson.order + 1} — {title}</strong>
      <button onClick={() => setEditing(true)}>Edit</button>
    </div>
  );
}
