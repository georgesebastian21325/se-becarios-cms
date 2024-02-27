import express, { query as expressQuery } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import cors from 'cors';
import { db, storage } from './firebase.js';
import { fetchArticles } from './API/GlobalAPI.js';
import {
  initializeApp,
  applicationDefault,
} from 'firebase-admin/app';
import firebaseAdmin from 'firebase-admin';
import { UserRecord, getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import bodyParser from 'body-parser';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  Query,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  where,
  query,
} from 'firebase/firestore';

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKeys.json', 'utf8'),
);

const firebaseApp = initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL:
    'https://www.project-best-cms.firebaseio.com',
});
const auth = getAuth(firebaseApp);
const database = getDatabase();

const app = express();

app.use(cors());

app.use(express.json());

const port = 5001;

app.use(
  bodyParser.urlencoded({
    limit: '25mb',
    extended: false,
  }),
);
app.use(bodyParser.json({ limit: '25mb' }));

//handles upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// FETCH ARTICLES

app.get('/fetch-articles', async (req, res) => {
  try {
    const articleSnapshot = await fetchArticles();

    return articleSnapshot;
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Internal Server Error' });
  }
});

// ADD ADMIN AUTH
app.post('/add-admin-auth', async (req, res) => {
  console.log(req.body);
  const {
    contactNumber,
    email,
    firstName,
    lastName,
    role,
  } = req.body;
  try {
    const UserRecord = await auth.createUser({
      contactNumber,
      email,
      firstName,
      lastName,
      role,
    });

    console.log(
      'Successfully created new user: ',
      UserRecord.id,
    );

    res.status(200).json({
      success: true,
      message: 'Successfully added',
    });

    // return { success: true };
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Failed to add admin',
    });
  }
});

// ADD ADMIN CREDENTIALS
app.post(
  '/add-admin-credentials',
  upload.single('admin-image'),
  async (req, res) => {
    console.log(req.body);
    const dateTime = new Date();
    const {
      contactNumber,
      email,
      firstName,
      lastName,
      role,
    } = req.body;
    console.log(req.file);
    try {
      const storageRef = ref(
        storage,
        `admin_photos/${req.file + dateTime}`,
      );
      let metadata = {};
      if (req.file) {
        metadata = { contentType: req.file.type };
      } else {
        console.log('No File Uploaded');
      }

      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata,
      );
      const downloadURL = await getDownloadURL(
        snapshot.ref,
      );

      await addDoc(collection(db, 'admin_credentials'), {
        contactNumber: contactNumber || null,
        email: email || null,
        firstName: firstName || null,
        image: downloadURL || null,
        lastName: lastName || null,
        role: role || null,
      })
        .then(() => {
          console.log('Doc written successfully');
        })
        .catch((error) => {
          console.log(`Error in writing doc: ${error}`);
        });

      // return { success: true };
      res.status(200).json({
        success: true,
        message: 'Successfully added',
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  },
);

// EDIT ADMIN CREDENTIALS

app.post(
  '/edit-admin-credentials/:id',
  upload.single('admin-image'),
  async (req, res) => {
    console.log(req.body);
    const dateTime = new Date();
    const {
      contactNumber,
      email,
      firstName,
      lastName,
      role,
    } = req.body;
    let downloadURL;
    const adminImage = req.body['admin-image'];
    console.log(req.file);
    console.log('Here: ' + adminImage);

    try {
      if (adminImage === undefined) {
        const storageRef = ref(
          storage,
          `admin_photos/${req.file + dateTime}`,
        );
        let metadata = {};
        if (req.file) {
          metadata = { contentType: req.file.type };
        } else {
          console.log('No File Uploaded');
        }

        const snapshot = await uploadBytesResumable(
          storageRef,
          req.file.buffer,
          metadata,
        );
        downloadURL = await getDownloadURL(snapshot.ref);
      } else {
        downloadURL = adminImage;
      }

      const docRef = doc(
        db,
        'admin_credentials',
        req.params.id,
      );

      await updateDoc(docRef, {
        contactNumber: contactNumber || null,
        email: email || null,
        firstName: firstName || null,
        image: downloadURL || null,
        lastName: lastName || null,
        role: role || null,
      })
        .then(() => {
          console.log('Doc updated successfully');
        })
        .catch((error) => {
          console.log(`Error in updating doc: ${error}`);
        });

      return res.send({
        message:
          'file uploaded to firebase storage and doc updated',
        name: req.image,
        type: req.image,
        downloadURL: downloadURL,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  },
);

// UPDATE ADMIN PASSWORD

app.post('/updatePasswordByEmail', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log('START: ' + email);
  try {
    // Get the user record by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(userRecord);
    // Extract the UID from the user record
    const uid = userRecord.uid;
    console.log('UID: ' + uid);

    // Update user's password
    await auth.updateUser(uid, {
      password: newPassword,
    });

    res.status(200).json({
      message: `Password updated successfully for user with email: ${email}`,
    });
  } catch (error) {
    console.error(
      'Error updating password:',
      error.message,
    );
    res.status(500).json({
      error: 'An error occurred while updating password',
    });
  }
});

// // Remove a user account on Firebase Authentication
async function removeUserAccount(userId) {
  try {
    // Get the user reference
    const user = await auth.getUser(userId);
    // Delete the user
    await auth.deleteUser(userId);
    console.log(`User ${userId} successfully removed`);
  } catch (error) {
    console.log('Error removing user account');
  }
}

// Server Status Checker
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

// Get Firebase Admin Authentication user ID by email
async function getUserIdByEmail(email) {
  const user = await auth.getUserByEmail(email);
  return user.uid;
}

// // Remove a user account on Firebase Authentication

app.post('/removeAdminCredAndAuth', async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    // Get Firebase Admin Authentication user ID by email
    const userId = await getUserIdByEmail(email);
    // Remove a user account on Firebase Authentication
    await removeUserAccount(userId);
    // Remove an Admin from the collection
    const adminCollection = collection(
      db,
      'admin_credentials',
    );

    const adminQuery = query(
      adminCollection,
      where('email', '==', email),
    );

    console.log(adminQuery);

    const querySnapshot = await getDocs(adminQuery);
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      console.log('Admin removed successfully');
      res
        .status(200)
        .send({ message: 'Admin removed successfully' });
    } else {
      throw new Error('Admin not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.toString() });
  }
});

///////////////////////////////// CREATE ARTICLE

// ADD ARTICLE
app.post(
  '/add-article',
  upload.single('article-image'),
  async (req, res) => {
    console.log(req.body);
    const dateTime = new Date();
    const { author, title, body, isApproved, isArchived } =
      req.body;
    console.log(req.file);
    try {
      const storageRef = ref(
        storage,
        `article_photos/${req.file + dateTime}`,
      );
      let metadata = {};
      if (req.file) {
        metadata = { contentType: req.file.type };
      } else {
        console.log('No File Uploaded');
      }

      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata,
      );
      const downloadURL = await getDownloadURL(
        snapshot.ref,
      );

      await addDoc(collection(db, 'articles'), {
        author,
        title,
        body,
        dateCreated: dateTime,
        datePosted: isApproved ? dateTime : null,
        dateArchived: null,
        dateEdited: null,
        image: downloadURL,
        isPostApproved: isApproved === 'true',
        submittedBy: author,
        titleEdit: '',
        imageEdit: '',
        bodyEdit: '',
        isEdited: false,
        isEditApproved: false,
        isArchived: false,
        isArchiveApproved: false,
      })
        .then(() => {
          console.log('Doc written successfully');
        })
        .catch((error) => {
          console.log(`Error in writing doc: ${error}`);
        });

      return res.send({
        message: 'file uploaded to firebase storage',
        name: req.image,
        type: req.image,
        downloadURL: downloadURL,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  },
);

// EDIT ARTICLE

app.post(
  '/edit-article-credentials/:id',
  upload.single('article-image'),
  async (req, res) => {
    console.log(req.body);
    const dateTime = new Date();
    const {
      lastEditedBy,
      title,
      body,
      isApproved,
      isArchived,
      role,
    } = req.body;
    let downloadURL;
    const articleImage = req.body['article-image'];
    console.log(req.file);
    console.log('Here: ' + articleImage);

    // try {
    if (articleImage === undefined) {
      const storageRef = ref(
        storage,
        `article_photos/${req.file + dateTime}`,
      );
      let metadata = {};
      if (req.file) {
        metadata = { contentType: req.file.type };
      } else {
        console.log('No File Uploaded');
      }

      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata,
      );
      downloadURL = await getDownloadURL(snapshot.ref);
    } else {
      downloadURL = articleImage;
    }

    const docRef = doc(db, 'articles', req.params.id);
    console.log(role);
    const isAdmin = role == 'Admin';
    try {
      if (isAdmin) {
        console.log('running as admin');
        await updateDoc(docRef, {
          lastEditedBy,
          titleEdit: title,
          bodyEdit: body,
          dateEdited: dateTime,
          imageEdit: downloadURL,
          isEditApproved: isApproved === 'true',
          isEdited: true,
          isArchived: false,
          isArchiveApproved: false,
          isPostApproved: true,
        })
          .then(() => {
            console.log('Doc updated successfully');
          })
          .catch((error) => {
            console.log(`Error in updating doc: ${error}`);
          });
      } else {
        await updateDoc(docRef, {
          lastEditedBy,
          title: title,
          body: body,
          dateEdited: dateTime,
          image: downloadURL,
          isEditApproved: isApproved === 'true',
          isEdited: true,
        })
          .then(() => {
            console.log('Doc updated successfully');
          })
          .catch((error) => {
            console.log(`Error in updating doc: ${error}`);
          });
      }

      return res.send({
        message:
          'file uploaded to firebase storage and doc updated',
        name: req.image,
        type: req.image,
        downloadURL: downloadURL,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  },
);
