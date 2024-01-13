import React, { useCallback, useEffect, useState } from "react";
import { DB1, USER_OBJECT_STORE } from "./constants";
import { v4 as uuidv4 } from "uuid";

const idb =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

const createCollectionInIndexedDB = () => {
    if (!idb) {
        console.log("db:: ", idb);
        return;
    }
    console.log(idb);

    const request = idb.open(DB1, 2);

    request.onerror = (event) => {
        console.log("An error occured while loading the indexed db", event);
    };

    request.onupgradeneeded = (event) => {
        const db = request.result;
        console.log(
            "db.objectStoreNames.contains(USER_OBJECT_STORE) :: ",
            db.objectStoreNames.contains(USER_OBJECT_STORE)
        );

        if (!db.objectStoreNames.contains(USER_OBJECT_STORE)) {
            db.createObjectStore(USER_OBJECT_STORE, {
                keyPath: "id",
            });
        }
    };

    request.onsuccess = (event) => {
        console.log("Database opened successfully!");
    };
};

const App: React.FC = () => {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [allUsersData, setAllUsersData] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const onAddUser = useCallback(
        (e) => {
            const dbPromise = idb.open(DB1, 2);

            if (firstName && lastName && email) {
                dbPromise.onsuccess = () => {
                    const db = dbPromise.result;
                    const tx = db.transaction(USER_OBJECT_STORE, "readwrite");

                    const userData = tx.objectStore(USER_OBJECT_STORE);

                    const users = userData.put({
                        id: selectedUser ?? uuidv4(), // existing ?? new
                        firstName,
                        lastName,
                        email,
                    });
                    users.onsuccess = () => {
                        tx.oncomplete = () => {
                            db.close();
                            getAllData();
                        };
                        alert("User added");
                        setFirstName("");
                        setLastName("");
                        setEmail("");
                    };

                    users.onerror = (e) => {
                        console.log(e);

                        setFirstName("");
                        setLastName("");
                        setEmail("");
                        alert(
                            "There was an error while adding this user to db."
                        );
                    };
                };
                setSelectedUser(null);
            }
        },
        [firstName, lastName, email]
    );

    useEffect(() => {
        createCollectionInIndexedDB();
        getAllData();
    }, []);

    const getAllData = () => {
        const dbP = idb.open(DB1, 2);
        dbP.onsuccess = () => {
            const db = dbP.result;
            const tx = db.transaction(USER_OBJECT_STORE, "readonly");

            const userData = tx.objectStore(USER_OBJECT_STORE);
            const users = userData.getAll();
            users.onsuccess = (query: any) => {
                setAllUsersData(query.srcElement.result);
            };
            users.onerror = (query) => {
                alert("Error occured while fetching users data.");
            };
            tx.oncomplete = () => {
                db.close();
            };
        };
    };

    const deleteUserdata = (selectedUser) => {
        const dbP = idb.open(DB1, 2);
        dbP.onsuccess = () => {
            const db = dbP.result;
            const tx = db.transaction(USER_OBJECT_STORE, "readwrite");

            const userData = tx.objectStore(USER_OBJECT_STORE);
            const deletedUser = userData.delete(selectedUser);
            deletedUser.onsuccess = (query: any) => {
                alert("User deleted!");
            };
            deletedUser.onerror = () => {};
            tx.oncomplete = () => {
                db.close();
                getAllData();
            };
        };
    };

    return (
        <div>
            <div className="">
                <table>
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsersData?.map((userData) => {
                            return (
                                <tr key={userData?.id}>
                                    <td>{userData?.firstName}</td>
                                    <td>{userData?.lastName}</td>
                                    <td>{userData?.email}</td>
                                    <td>
                                        <button
                                            className=""
                                            onClick={() => {
                                                setSelectedUser(userData?.id);
                                                setFirstName(
                                                    userData?.firstName
                                                );
                                                setLastName(userData?.lastName);
                                                setEmail(userData?.email);
                                            }}
                                        >
                                            Edit
                                        </button>{" "}
                                        <button
                                            className=""
                                            onClick={() => {
                                                deleteUserdata(userData?.id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div>
                <div>
                    <h3>Add user</h3>
                    <div>
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            onChange={(e) => {
                                setFirstName(e.target.value);
                            }}
                            value={firstName}
                        />
                    </div>
                    <div>
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            onChange={(e) => {
                                setLastName(e.target.value);
                            }}
                            value={lastName}
                        />
                    </div>
                    <div>
                        <label>Email</label>
                        <input
                            type="text"
                            name="lastName"
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            value={email}
                        />
                    </div>
                    <div>
                        <button onClick={onAddUser}>
                            {selectedUser ? "Update" : "Add"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
