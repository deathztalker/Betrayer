/* =========================================================================
   Firebase — Likes & Comments for Betrayer Gallery
   Uses Firestore for persistence + Anonymous Auth for user identification
   ========================================================================= */

(function () {
  "use strict";

  var firebaseConfig = {
    apiKey: "AIzaSyCcYWJOea9G5uMssPphdfRsk5DTgKwy3u0",
    authDomain: "betrayer-381ff.firebaseapp.com",
    projectId: "betrayer-381ff",
    storageBucket: "betrayer-381ff.firebasestorage.app",
    messagingSenderId: "707171079694",
    appId: "1:707171079694:web:ad34b4d11cc0879cb18e5f"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  var auth = firebase.auth();
  var currentUid = null;

  // Sign in anonymously to get a stable UID
  auth.signInAnonymously().catch(function (err) {
    console.warn("Firebase anon auth failed:", err);
  });
  auth.onAuthStateChanged(function (user) {
    if (user) {
      currentUid = user.uid;
    }
  });

  // Generate a safe document ID from a photo path
  function photoId(path) {
    return path.replace(/[^a-zA-Z0-9]/g, "_");
  }

  // ---- LIKES ----------------------------------------------------------------

  /**
   * Toggle like for a photo. Returns a promise.
   * @param {string} path - the photo path (used as document ID)
   */
  window.fireToggleLike = function (path) {
    if (!currentUid) return Promise.resolve();
    var docRef = db.collection("photos").doc(photoId(path));

    return db.runTransaction(function (transaction) {
      return transaction.get(docRef).then(function (doc) {
        if (!doc.exists) {
          transaction.set(docRef, { likes: 1, likedBy: [currentUid] });
        } else {
          var data = doc.data();
          var likedBy = data.likedBy || [];
          var idx = likedBy.indexOf(currentUid);
          if (idx >= 0) {
            // Unlike
            likedBy.splice(idx, 1);
            transaction.update(docRef, {
              likes: Math.max(0, (data.likes || 1) - 1),
              likedBy: likedBy
            });
          } else {
            // Like
            likedBy.push(currentUid);
            transaction.update(docRef, {
              likes: (data.likes || 0) + 1,
              likedBy: likedBy
            });
          }
        }
      });
    });
  };

  /**
   * Subscribe to real-time like updates for a photo.
   * @param {string} path
   * @param {function} callback - receives { likes: number, liked: boolean }
   * @returns {function} unsubscribe function
   */
  window.fireListenLikes = function (path, callback) {
    var docRef = db.collection("photos").doc(photoId(path));
    return docRef.onSnapshot(function (doc) {
      if (doc.exists) {
        var data = doc.data();
        var liked = (data.likedBy || []).indexOf(currentUid) >= 0;
        callback({ likes: data.likes || 0, liked: liked });
      } else {
        callback({ likes: 0, liked: false });
      }
    });
  };

  // ---- COMMENTS -------------------------------------------------------------

  /**
   * Add a comment to a photo.
   * @param {string} path
   * @param {string} text
   * @param {string} name - commenter name (optional)
   */
  window.fireAddComment = function (path, text, name) {
    if (!text || !text.trim()) return Promise.resolve();
    var commentsRef = db.collection("photos").doc(photoId(path)).collection("comments");
    return commentsRef.add({
      text: text.trim().substring(0, 500),
      name: (name && name.trim()) ? name.trim().substring(0, 40) : "Anónimo",
      uid: currentUid || "unknown",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  /**
   * Subscribe to real-time comments for a photo.
   * @param {string} path
   * @param {function} callback - receives array of { text, name, createdAt }
   * @returns {function} unsubscribe function
   */
  window.fireListenComments = function (path, callback) {
    var commentsRef = db.collection("photos").doc(photoId(path))
      .collection("comments")
      .orderBy("createdAt", "desc")
      .limit(100);
    return commentsRef.onSnapshot(function (snapshot) {
      var comments = [];
      snapshot.forEach(function (doc) {
        var d = doc.data();
        comments.push({
          id: doc.id,
          text: d.text,
          name: d.name,
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date()
        });
      });
      callback(comments);
    });
  };

})();
