# Add one resource

Example: an authenticated user's notes. This is documentation only; no note model, routes, or demo data are installed. Delete this guide when it is no longer useful.

1. **Model — backend/src/models/Note.js.** Define a Mongoose schema with title (required String, max 120), owner (required ObjectId referencing User), and timestamps. Export mongoose.model('Note', schema). Ownership comes from req.user, never from submitted owner IDs.
2. **Validation — backend/src/validators/note.js.** Export rules using body('title').isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Enter a title of 1–120 characters.'). Reuse validate from validators/auth.js (move it to middlewares/validate.js as you add resources). Validate path IDs with param('id').isMongoId() before using them in queries.
3. **Controller — backend/src/controllers/notes.js.** Use async functions; Express 5 forwards rejected promises to the error handler. For creation, use only explicitly accepted fields:

   ```js
   const note = await Note.create({
     title: req.body.title,
     owner: req.user._id,
   });
   res.status(201).json({ data: { note } });
   ```

   List with Note.find({ owner: req.user.\_id }).sort({ createdAt: -1 }).limit(50). For lookup, update, or deletion, include both \_id and owner in the database query. Throw new AppError(404, 'NOT_FOUND', 'Note not found.') if it does not match. A frontend guard alone does not protect data.

4. **Route — backend/src/routes/notes.js.** Follow authRoutes(config): create a Router, router.use(requireAuth(config)), then router.get('/', listNotes) and router.post('/', noteRules, validate, createNote). Mount app.use('/api/notes', noteRoutes(config)) before notFound in app.js. Consider a write limiter based on your resource's cost.
5. **Frontend service — frontend/src/services/notes.js.** Export listNotes = () => api('/notes') and createNote = title => api('/notes', { method: 'POST', body: { title } }). The client already sends cookies, handles the common error envelope, and announces expired sessions.
6. **Page — frontend/src/pages/Notes.jsx.** Fetch through the service; show loading, empty, failure/retry, and success states. Cancel the initial request on unmount if using api directly. Add a labeled title input and submit button, display error.fields.title, and disable submission while pending. Add a /notes route inside ProtectedRoute and a navigation link.
7. **Tests.** Add cases to the existing isolated backend harness: signed-out access is 401, invalid title is 422, valid creation is 201, and user B cannot read/update/delete user A's note. Register any new collection in the owned database cleanup. Add a frontend test only for meaningful new behavior.

Keep the flow visible: model → validation → controller → route → frontend service → page. Avoid generic repository/service abstractions until real repetition warrants them.
