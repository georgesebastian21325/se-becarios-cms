import express, { query as expressQuery } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import cors from 'cors';
import { db, storage } from './firebase.js';
import { fetchArticles } from './API/GlobalAPI.js';
import { downloadAuditTrailRecord } from './API/SettingsAPI.js';
import {
  initializeApp,
  applicationDefault,
} from 'firebase-admin/app';
import firebaseAdmin from 'firebase-admin';
import { UserRecord, getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import bodyParser from 'body-parser';
import {
  deleteObject,
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
  getDoc,
} from 'firebase/firestore';
import os from 'os';
import path from 'path';
import fetch from 'cross-fetch';
import archiver from 'archiver';

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

      res.status(200).json({
        success: true,
        message: 'Successfully edited',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        error: 'Failed to edit admin',
      });
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
      success: true,
      message: 'Successfully updated password',
    });
  } catch (error) {
    console.error(
      'Error updating password:',
      error.message,
    );
    res.status(500).json({
      success: false,
      error: 'Error updating password',
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
  // throw new Error();
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

    const querySnapshot = await getDocs(adminQuery);

    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        const data = doc.data();
        const imageRef = ref(storage, data.image);
        await deleteObject(imageRef);
        await deleteDoc(doc.ref);
      });

      console.log('Admin removed successfully');
      res.status(200).json({
        success: true,
        message: 'Admin removed successfully',
      });
    } else {
      throw new Error('Admin not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error removing admin credentials',
    });
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

      res.status(200).json({
        success: true,
        message: 'Article Post processed successfully',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to process Article Post',
      });
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

      res.status(200).json({
        success: true,
        message: 'Edit Article processed successfully',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: true,
        message: 'Failed to process Edit Article',
      });
    }
  },
);

// DOWNLOAD ALL POSTED RECORDS
app.get('/download-all-records', async (req, res) => {
  let downloadsDirectory;
  const articleCollection = collection(db, 'articles');
  const postedArticlesQuery = query(
    articleCollection,
    where('isPostApproved', '==', true),
  );
  try {
    const dateDownload = new Date();
    const day = String(dateDownload.getDate()).padStart(
      2,
      '0',
    );
    const month = String(
      dateDownload.getMonth() + 1,
    ).padStart(2, '0'); // Month is zero-based
    const year = String(dateDownload.getFullYear());

    // Create the string in the desired format
    const dateString = `-${year}-${month}-${day}`;
    const snapshot = await getDocs(postedArticlesQuery);
    const homeDirectory = os.homedir();
    downloadsDirectory = path.join(
      homeDirectory,
      `downloads/Becarios-Records${dateString}`,
    );

    if (!fs.existsSync(downloadsDirectory)) {
      fs.mkdirSync(downloadsDirectory);
    }

    const outputZip = fs.createWriteStream(
      `${downloadsDirectory}.zip`,
    );
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(outputZip);

    for (const doc of snapshot.docs) {
      const article = doc.data();
      const { title, author, body, image } = article;

      const cleanedTitle = title.replace(/[^\w\s]/gi, '');
      const cleanedBody = body.replace(/<[^>]*>/g, '');
      const folderName = `${cleanedTitle}`; // Folder name includes cleaned title and date
      const articleDirectory = path.join(
        downloadsDirectory,
        folderName,
      );

      if (!fs.existsSync(articleDirectory)) {
        fs.mkdirSync(articleDirectory);
      }
      const { seconds, nanoseconds } = article.datePosted;
      const milliseconds =
        seconds * 1000 + nanoseconds / 1000000;
      const datePosted = new Date(milliseconds);
      // Write text content to a txt file
      const txtFilePath = path.join(
        articleDirectory,
        `${cleanedTitle}.txt`,
      );
      const fileContent = `Title: ${title}\nAuthor: ${author}\n\nBody: ${cleanedBody}\n\nDate Posted: ${datePosted}\nDate Downloaded: ${dateDownload}`;
      await fs.promises.writeFile(txtFilePath, fileContent);

      console.log(
        `File ${cleanedTitle}.txt created successfully in the ${folderName} directory.`,
      );

      // Download image file
      if (image) {
        const imageFileName = `${cleanedTitle}_image.jpg`;
        const imageFilePath = path.join(
          articleDirectory,
          imageFileName,
        );

        try {
          const imageDownloadURL = await getDownloadURL(
            ref(storage, image),
          );
          const imageResponse = await fetch(
            imageDownloadURL,
          );
          const imageBuffer = await imageResponse.buffer();

          await fs.promises.writeFile(
            imageFilePath,
            imageBuffer,
          );

          console.log(
            `Image ${imageFileName} downloaded successfully.`,
          );

          // Append image to the archive
          archive.file(imageFilePath, {
            name: `${folderName}/${imageFileName}`,
          });
        } catch (error) {
          console.error(
            `Error downloading image ${imageFileName}:`,
            error,
          );
        }
      }

      // Append text file to the archive
      archive.file(txtFilePath, {
        name: `${folderName}/${cleanedTitle}.txt`,
      });
    }

    // Finalize the archive
    archive.finalize();

    // Once the archive is finalized, send the download response
    outputZip.on('close', () => {
      console.log(
        'Archive has been finalized and the output file descriptor has closed.',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Becarios-Records${dateString}.zip"`,
      );
      res.setHeader('Content-Type', 'application/zip');
      res.download(`${downloadsDirectory}.zip`, () => {
        // Cleanup: Remove the generated files after download
        fs.rmSync(`${downloadsDirectory}.zip`, {
          force: true,
          recursive: true,
        });

        // Remove the directories
        fs.rmdirSync(downloadsDirectory, {
          recursive: true,
        });
      });
    });
  } catch (error) {
    console.error('Error fetching posted articles:', error);
    res.status(500).send('Internal Server Error');
  }
});

// DOWNLOAD ALL ARCHIVED RECORDS
app.get(
  '/download-all-archived-records',
  async (req, res) => {
    let downloadsDirectory;
    const articleCollection = collection(db, 'articles');
    const postedArticlesQuery = query(
      articleCollection,
      where('isArchived', '==', true),
      where('isArchiveApproved', '==', true),
    );
    try {
      const dateDownload = new Date();
      const day = String(dateDownload.getDate()).padStart(
        2,
        '0',
      );
      const month = String(
        dateDownload.getMonth() + 1,
      ).padStart(2, '0'); // Month is zero-based
      const year = String(dateDownload.getFullYear());

      // Create the string in the desired format
      const dateString = `-${year}-${month}-${day}`;
      const snapshot = await getDocs(postedArticlesQuery);
      const homeDirectory = os.homedir();
      downloadsDirectory = path.join(
        homeDirectory,
        `downloads/Becarios-Records${dateString}`,
      );

      if (!fs.existsSync(downloadsDirectory)) {
        fs.mkdirSync(downloadsDirectory);
      }

      const outputZip = fs.createWriteStream(
        `${downloadsDirectory}.zip`,
      );
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(outputZip);

      for (const doc of snapshot.docs) {
        const article = doc.data();
        const { title, author, body, image } = article;

        const cleanedTitle = title.replace(/[^\w\s]/gi, '');
        const cleanedBody = body.replace(/<[^>]*>/g, '');
        const folderName = `${cleanedTitle}`; // Folder name includes cleaned title and date
        const articleDirectory = path.join(
          downloadsDirectory,
          folderName,
        );

        if (!fs.existsSync(articleDirectory)) {
          fs.mkdirSync(articleDirectory);
        }
        const { seconds, nanoseconds } = article.datePosted;
        const milliseconds =
          seconds * 1000 + nanoseconds / 1000000;
        const datePosted = new Date(milliseconds);
        // Write text content to a txt file
        const txtFilePath = path.join(
          articleDirectory,
          `${cleanedTitle}.txt`,
        );
        const fileContent = `Title: ${title}\nAuthor: ${author}\n\nBody: ${cleanedBody}\n\nDate Posted: ${datePosted}\nDate Downloaded: ${dateDownload}`;
        await fs.promises.writeFile(
          txtFilePath,
          fileContent,
        );

        console.log(
          `File ${cleanedTitle}.txt created successfully in the ${folderName} directory.`,
        );

        // Download image file
        if (image) {
          const imageFileName = `${cleanedTitle}_image.jpg`;
          const imageFilePath = path.join(
            articleDirectory,
            imageFileName,
          );

          try {
            const imageDownloadURL = await getDownloadURL(
              ref(storage, image),
            );
            const imageResponse = await fetch(
              imageDownloadURL,
            );
            const imageBuffer =
              await imageResponse.buffer();

            await fs.promises.writeFile(
              imageFilePath,
              imageBuffer,
            );

            console.log(
              `Image ${imageFileName} downloaded successfully.`,
            );

            // Append image to the archive
            archive.file(imageFilePath, {
              name: `${folderName}/${imageFileName}`,
            });
          } catch (error) {
            console.error(
              `Error downloading image ${imageFileName}:`,
              error,
            );
          }
        }

        // Append text file to the archive
        archive.file(txtFilePath, {
          name: `${folderName}/${cleanedTitle}.txt`,
        });
      }

      // Finalize the archive
      archive.finalize();

      // Once the archive is finalized, send the download response
      outputZip.on('close', () => {
        console.log(
          'Archive has been finalized and the output file descriptor has closed.',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="Becarios-Records${dateString}.zip"`,
        );
        res.setHeader('Content-Type', 'application/zip');
        res.download(`${downloadsDirectory}.zip`, () => {
          // Cleanup: Remove the generated files after download
          fs.rmSync(`${downloadsDirectory}.zip`, {
            force: true,
            recursive: true,
          });

          // Remove the directories
          fs.rmdirSync(downloadsDirectory, {
            recursive: true,
          });
        });
      });
    } catch (error) {
      console.error(
        'Error fetching posted articles:',
        error,
      );
      res.status(500).send('Internal Server Error');
    }
  },
);

app.get('/download-settings-audit-trail-record', async (req, res) => {
  try {
      await downloadAuditTrailRecord(res); // Pass the response object to the function
  } catch (error) {
      console.error('Error handling download request:', error);
      res.status(500).send('Internal Server Error');
  }
});
