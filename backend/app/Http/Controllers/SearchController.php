<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\SearchRepository;

final class SearchController
{
    public function __construct(private readonly SearchRepository $searchRepository)
    {
    }

    public function search(array $queryParams): array
    {
        $result = $this->searchRepository->searchAvailableListings($queryParams);
        return [
            'status_code' => 200,
            'data' => $result['data'],
            'pagination' => $result['pagination'],
        ];
    }
}
