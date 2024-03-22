import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return(
        <>
        <Head>
            <title>Your Title</title>
            <meta name="description" content="Made with NextJS"/>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main>
            <div className={styles.main}>
                <form className={styles.form}>
                    <div className="text-center">
                        <h1>KONTOL</h1>
                    </div>
                </form>
            </div>
        </main>
        </>
    );
}