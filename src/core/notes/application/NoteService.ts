import { requireScene, type SceneLocator } from '@/core/shared';
import {
  NoteCreationFailedError,
  NoteNotFoundError,
  assertNoteFeatures,
  assertNoteLevels,
  type Note,
  type NoteChanges,
  type NoteEnvironment,
  type NoteStore
} from '@/core/notes/domain';
import type {
  CreateNoteCommand,
  DeleteNoteCommand,
  ListNotesQuery,
  UpdateNoteCommand
} from './commands';

export interface NoteServiceDependencies {
  readonly scenes: SceneLocator;
  readonly notes: NoteStore;
  /** Feature and level checks of the running world; without one every feature counts as present and levels go unchecked. */
  readonly environment?: NoteEnvironment | undefined;
}

export interface NoteListResult {
  readonly sceneId: string;
  readonly notes: readonly Note[];
}

export interface NoteDeletionResult {
  readonly sceneId: string;
  readonly noteId: string;
}

export class NoteService {
  constructor(private readonly deps: NoteServiceDependencies) {}

  listNotes(query: ListNotesQuery): NoteListResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, notes: this.deps.notes.listNotes(scene.id) };
  }

  async createNote(command: CreateNoteCommand): Promise<Note> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.checkChanges(scene.id, command.draft);
    const note = await this.deps.notes.createNote(scene.id, command.draft);
    if (note === null) {
      throw new NoteCreationFailedError();
    }
    return note;
  }

  async updateNote(command: UpdateNoteCommand): Promise<Note> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireNote(scene.id, command.noteId);
    this.checkChanges(scene.id, command.changes);
    const updated = await this.deps.notes.updateNote(scene.id, command.noteId, command.changes);
    if (updated === null) {
      throw new NoteNotFoundError(command.noteId);
    }
    return updated;
  }

  async deleteNote(command: DeleteNoteCommand): Promise<NoteDeletionResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireNote(scene.id, command.noteId);
    await this.deps.notes.deleteNote(scene.id, command.noteId);
    return { sceneId: scene.id, noteId: command.noteId };
  }

  private checkChanges(sceneId: string, changes: NoteChanges): void {
    const environment = this.deps.environment;
    if (environment === undefined) {
      return;
    }
    assertNoteFeatures(changes, environment.features());
    if (changes.levels !== undefined) {
      assertNoteLevels(changes.levels, environment.listSceneLevelIds(sceneId));
    }
  }

  private requireNote(sceneId: string, noteId: string): Note {
    const note = this.deps.notes.findNote(sceneId, noteId);
    if (note === null) {
      throw new NoteNotFoundError(noteId);
    }
    return note;
  }
}
