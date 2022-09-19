import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useDispatch, useSelector } from "react-redux";
import { messagesApi } from "../../../features/messages/messagesApi";
import { useParams } from "react-router-dom";
import Message from "./Message";

export default function Messages({ messages = [], totalCount }) {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  console.log("messages: ", messages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();

  const fetchMore = () => {
    console.log("fetchMore: ", page + 1);
    setPage((prevPage) => prevPage + 1);
  };
  useEffect(() => {
    if (page > 1) {
      dispatch(
        messagesApi.endpoints.getMoreMessages.initiate({
          id,
          page,
        })
      );
    }
  }, [page, email, dispatch]);

  useEffect(() => {
    if (totalCount > 0) {
      const more =
        Math.ceil(
          totalCount / Number(process.env.REACT_APP_MESSAGES_PER_PAGE)
        ) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);
  return (
    <div
      className="relative w-full h-[calc(100vh_-_197px)] p-6 overflow-y-auto flex flex-col-reverse"
      id="scrollableDiv"
    >
      <InfiniteScroll
        dataLength={messages.length}
        next={fetchMore}
        hasMore={hasMore}
        style={{ display: "flex", flexDirection: "column-reverse" }} //To put endMessage and loader to the top.
        inverse
        loader={<h4>Loading...</h4>}
        scrollableTarget="scrollableDiv"
      >
        <ul className="space-y-2">
          {messages
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => {
              const { message: lastMessage, id, sender } = message || {};

              const justify = sender.email !== email ? "start" : "end";

              return (
                <Message key={id} justify={justify} message={lastMessage} />
              );
            })}
        </ul>
      </InfiniteScroll>
    </div>
  );
}
