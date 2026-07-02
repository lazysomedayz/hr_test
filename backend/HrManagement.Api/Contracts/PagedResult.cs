namespace HrManagement.Api.Contracts;

public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int Size,
    int TotalCount,
    int AllCount,
    int ActiveCount,
    int InactiveCount);
